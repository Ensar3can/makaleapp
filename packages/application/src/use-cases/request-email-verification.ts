import {
  AUTH_RATE_LIMITS,
  AUTH_TTL,
  AuthToken,
  AuthTokenPurpose,
  UnauthenticatedError,
  asAuthTokenId,
  asUserId,
  type AuthTokenRepository,
  type UserRepository,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import type { Clock, EmailSender, IdGenerator, RateLimiter, TokenDigest, TokenGenerator } from '../ports';
import { verificationUrl } from '../ports';
import type { UseCase } from '../use-case';

export interface RequestEmailVerificationInput {
  readonly userId: string;
  readonly appOrigin: string;
}

export class RequestEmailVerificationUseCase implements UseCase<RequestEmailVerificationInput, void> {
  public constructor(
    private readonly users: UserRepository,
    private readonly authTokens: AuthTokenRepository,
    private readonly tokenGenerator: TokenGenerator,
    private readonly tokenDigest: TokenDigest,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly emails: EmailSender,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: RequestEmailVerificationInput): Promise<void> {
    await consumeRateLimit(
      this.rateLimiter,
      'resend-user',
      input.userId,
      AUTH_RATE_LIMITS.resendVerificationPerUser,
    );
    const user = await this.users.findById(asUserId(input.userId));

    if (!user?.isActive()) {
      throw new UnauthenticatedError();
    }

    if (user.emailVerifiedAt) {
      return;
    }

    const now = this.clock.now();
    await this.authTokens.consumeUnconsumed(user.id, AuthTokenPurpose.EMAIL_VERIFICATION, now);

    const rawToken = this.tokenGenerator.next();
    await this.authTokens.save(
      AuthToken.issue({
        id: asAuthTokenId(this.ids.next()),
        userId: user.id,
        purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
        tokenHash: this.tokenDigest.hash(rawToken),
        now,
        ttlSeconds: AUTH_TTL.emailVerificationSeconds,
      }),
    );
    await this.emails.send({
      to: user.email.value,
      subject: 'Verify your email',
      text: `Confirm your Article Intelligence Platform account:\n${verificationUrl(input.appOrigin, rawToken)}`,
    });
  }
}
