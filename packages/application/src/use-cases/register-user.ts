import {
  AUTH_RATE_LIMITS,
  AUTH_TTL,
  AuthToken,
  AuthTokenPurpose,
  EmailAddress,
  EmailAlreadyRegisteredError,
  Profile,
  Slug,
  User,
  UsernameTakenError,
  asAuthTokenId,
  asProfileId,
  asUserId,
  assertPassword,
  type AuthTokenRepository,
  type ProfileRepository,
  type UserRepository,
} from '@aip/domain';
import { RateLimitedError } from '../errors';
import type { Clock, EmailSender, IdGenerator, PasswordHasher, RateLimiter, TokenDigest, TokenGenerator } from '../ports';
import { normalizeClientIp, rateLimitKey, verificationUrl } from '../ports';
import { toAuthenticatedIdentity, type AuthenticatedIdentity } from '../public-identity';
import type { UseCase } from '../use-case';

export interface RegisterUserInput {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly username: string;
  readonly ip?: string | null;
  readonly appOrigin: string;
}

export class RegisterUserUseCase implements UseCase<RegisterUserInput, AuthenticatedIdentity> {
  public constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly authTokens: AuthTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly tokenDigest: TokenDigest,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly emails: EmailSender,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: RegisterUserInput): Promise<AuthenticatedIdentity> {
    const ip = normalizeClientIp(input.ip);
    const registerLimit = await this.rateLimiter.consume(
      rateLimitKey('register-ip', ip),
      AUTH_RATE_LIMITS.registerPerIp.limit,
      AUTH_RATE_LIMITS.registerPerIp.windowMs,
    );

    if (!registerLimit.allowed) {
      throw new RateLimitedError(registerLimit.retryAfterMs);
    }

    const email = EmailAddress.from(input.email);
    const username = Slug.from(input.username);
    assertPassword(input.password);

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    if (await this.profiles.findByUsername(username)) {
      throw new UsernameTakenError();
    }

    const now = this.clock.now();
    const user = User.register({
      id: asUserId(this.ids.next()),
      email,
      passwordHash: await this.passwordHasher.hash(input.password),
      now,
    });
    const profile = Profile.create({
      id: asProfileId(this.ids.next()),
      userId: user.id,
      displayName: input.displayName,
      username,
      now,
    });
    const rawToken = this.tokenGenerator.next();
    const token = AuthToken.issue({
      id: asAuthTokenId(this.ids.next()),
      userId: user.id,
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
      tokenHash: this.tokenDigest.hash(rawToken),
      now,
      ttlSeconds: AUTH_TTL.emailVerificationSeconds,
    });

    await this.users.save(user);
    await this.profiles.save(profile);
    await this.authTokens.save(token);
    await this.emails.send({
      to: user.email.value,
      subject: 'Verify your email',
      text: `Confirm your Article Intelligence Platform account:\n${verificationUrl(input.appOrigin, rawToken)}`,
    });

    return toAuthenticatedIdentity(user, profile);
  }
}
