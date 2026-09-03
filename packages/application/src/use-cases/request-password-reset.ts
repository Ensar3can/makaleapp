import {
  AUTH_RATE_LIMITS,
  AUTH_TTL,
  AuthToken,
  AuthTokenPurpose,
  EmailAddress,
  asAuthTokenId,
  type AuthTokenRepository,
  type UserRepository,
} from '@aip/domain';
import { RateLimitedError } from '../errors';
import type { Clock, EmailSender, IdGenerator, RateLimiter, TokenDigest, TokenGenerator } from '../ports';
import { normalizeClientIp, passwordResetUrl, rateLimitKey } from '../ports';
import type { UseCase } from '../use-case';

export interface RequestPasswordResetInput {
  readonly email: string;
  readonly ip?: string | null;
  readonly appOrigin: string;
}

export class RequestPasswordResetUseCase implements UseCase<RequestPasswordResetInput, void> {
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

  public async execute(input: RequestPasswordResetInput): Promise<void> {
    const ip = normalizeClientIp(input.ip);
    const limit = await this.rateLimiter.consume(
      rateLimitKey('forgot-ip', ip),
      AUTH_RATE_LIMITS.forgotPasswordPerIp.limit,
      AUTH_RATE_LIMITS.forgotPasswordPerIp.windowMs,
    );

    if (!limit.allowed) {
      throw new RateLimitedError(limit.retryAfterMs);
    }

    const email = EmailAddress.from(input.email);
    const user = await this.users.findByEmail(email);

    if (!user?.isActive()) {
      return;
    }

    const now = this.clock.now();
    await this.authTokens.consumeUnconsumed(user.id, AuthTokenPurpose.PASSWORD_RESET, now);

    const rawToken = this.tokenGenerator.next();
    await this.authTokens.save(
      AuthToken.issue({
        id: asAuthTokenId(this.ids.next()),
        userId: user.id,
        purpose: AuthTokenPurpose.PASSWORD_RESET,
        tokenHash: this.tokenDigest.hash(rawToken),
        now,
        ttlSeconds: AUTH_TTL.passwordResetSeconds,
      }),
    );
    await this.emails.send({
      to: user.email.value,
      subject: 'Reset your password',
      text: `Reset your Article Intelligence Platform password:\n${passwordResetUrl(input.appOrigin, rawToken)}`,
    });
  }
}
