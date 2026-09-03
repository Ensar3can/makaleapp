import {
  AUTH_RATE_LIMITS,
  AuthTokenInvalidError,
  AuthTokenPurpose,
  assertPassword,
  type AuthTokenRepository,
  type SessionRepository,
  type UserRepository,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import type { Clock, PasswordHasher, RateLimiter, TokenDigest } from '../ports';
import { normalizeClientIp } from '../ports';
import type { UseCase } from '../use-case';

export interface ResetPasswordInput {
  readonly token: string;
  readonly password: string;
  readonly clientIp?: string;
}

export class ResetPasswordUseCase implements UseCase<ResetPasswordInput, void> {
  public constructor(
    private readonly authTokens: AuthTokenRepository,
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenDigest: TokenDigest,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: ResetPasswordInput): Promise<void> {
    await consumeRateLimit(
      this.rateLimiter,
      'reset-ip',
      normalizeClientIp(input.clientIp),
      AUTH_RATE_LIMITS.resetPasswordPerIp,
    );
    const raw = input.token.trim();

    if (raw.length === 0) {
      throw new AuthTokenInvalidError();
    }

    assertPassword(input.password);

    const token = await this.authTokens.findByTokenHash(this.tokenDigest.hash(raw));
    const now = this.clock.now();

    if (!token || token.purpose !== AuthTokenPurpose.PASSWORD_RESET) {
      throw new AuthTokenInvalidError();
    }

    const consumed = token.consume(now);
    const user = await this.users.findById(consumed.userId);

    if (!user?.isActive()) {
      throw new AuthTokenInvalidError();
    }

    const updated = user.changePasswordHash(await this.passwordHasher.hash(input.password), now);
    await this.authTokens.save(consumed);
    await this.users.save(updated);
    await this.sessions.revokeAllForUser(updated.id, now);
  }
}
