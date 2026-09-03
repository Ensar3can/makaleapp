import {
  ACCOUNT_LOCK_POLICY,
  AUTH_RATE_LIMITS,
  AUTH_TTL,
  AccountLockedError,
  EmailAddress,
  InvalidCredentialsError,
  LoginAttempt,
  Session,
  asLoginAttemptId,
  asSessionId,
  isAccountLocked,
  type LoginAttemptRepository,
  type ProfileRepository,
  type SessionRepository,
  type UserRepository,
} from '@aip/domain';
import { RateLimitedError } from '../errors';
import type { Clock, IdGenerator, PasswordHasher, RateLimiter, TokenDigest, TokenGenerator } from '../ports';
import { hashableEmail, normalizeClientIp, rateLimitKey } from '../ports';
import { toAuthenticatedIdentity, type AuthenticatedIdentity } from '../public-identity';
import type { UseCase } from '../use-case';

export interface LoginUserInput {
  readonly email: string;
  readonly password: string;
  readonly ip?: string | null;
  readonly userAgent?: string | null;
  readonly sessionTtlSeconds?: number;
}

export interface LoginUserResult extends AuthenticatedIdentity {
  readonly sessionToken: string;
}

export class LoginUserUseCase implements UseCase<LoginUserInput, LoginUserResult> {
  private dummyHashPromise: Promise<string> | undefined;

  public constructor(
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly sessions: SessionRepository,
    private readonly loginAttempts: LoginAttemptRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
    private readonly tokenDigest: TokenDigest,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: LoginUserInput): Promise<LoginUserResult> {
    const email = EmailAddress.from(input.email);
    const ip = normalizeClientIp(input.ip);
    await this.enforceRateLimits(ip, hashableEmail(email));

    const now = this.clock.now();
    const recent = await this.loginAttempts.listRecentByEmail(
      email,
      new Date(now.getTime() - ACCOUNT_LOCK_POLICY.windowMs),
    );

    if (isAccountLocked(recent, now)) {
      throw new AccountLockedError();
    }

    const user = await this.users.findByEmail(email);
    const passwordHash = user?.passwordHash ?? (await this.dummyHash());
    const passwordMatches = await this.passwordHasher.verify(input.password, passwordHash);
    const canSignIn = Boolean(user?.isActive() && passwordMatches);

    await this.loginAttempts.record(
      LoginAttempt.record({
        id: asLoginAttemptId(this.ids.next()),
        email,
        succeeded: canSignIn,
        createdAt: now,
      }),
    );

    if (!canSignIn) {
      const nextAttempts = [
        ...recent,
        LoginAttempt.record({
          id: asLoginAttemptId('pending'),
          email,
          succeeded: false,
          createdAt: now,
        }),
      ];

      if (isAccountLocked(nextAttempts, now)) {
        throw new AccountLockedError();
      }

      throw new InvalidCredentialsError();
    }

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const rawToken = this.tokenGenerator.next();
    const session = Session.issue({
      id: asSessionId(this.ids.next()),
      userId: user.id,
      tokenHash: this.tokenDigest.hash(rawToken),
      now,
      ttlSeconds: input.sessionTtlSeconds ?? AUTH_TTL.sessionSeconds,
      userAgent: input.userAgent ?? null,
    });
    const signedIn = user.recordLogin(now);
    await this.users.save(signedIn);
    await this.sessions.save(session);

    const profile = await this.profiles.findByUserId(signedIn.id);
    return {
      ...toAuthenticatedIdentity(signedIn, profile),
      sessionToken: rawToken,
    };
  }

  private async enforceRateLimits(ip: string, email: string): Promise<void> {
    const ipLimit = await this.rateLimiter.consume(
      rateLimitKey('login-ip', ip),
      AUTH_RATE_LIMITS.loginPerIp.limit,
      AUTH_RATE_LIMITS.loginPerIp.windowMs,
    );

    if (!ipLimit.allowed) {
      throw new RateLimitedError(ipLimit.retryAfterMs);
    }

    const emailLimit = await this.rateLimiter.consume(
      rateLimitKey('login-email', email),
      AUTH_RATE_LIMITS.loginPerEmail.limit,
      AUTH_RATE_LIMITS.loginPerEmail.windowMs,
    );

    if (!emailLimit.allowed) {
      throw new RateLimitedError(emailLimit.retryAfterMs);
    }
  }

  private dummyHash(): Promise<string> {
    this.dummyHashPromise ??= this.passwordHasher.hash('not-a-real-user-password-dummy');
    return this.dummyHashPromise;
  }
}
