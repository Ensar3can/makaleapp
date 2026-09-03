import {
  AuthTokenInvalidError,
  AuthTokenPurpose,
  type AuthTokenRepository,
  type UserRepository,
} from '@aip/domain';
import type { Clock, TokenDigest } from '../ports';
import { toPublicUser, type PublicUser } from '../public-identity';
import type { UseCase } from '../use-case';

export interface VerifyEmailInput {
  readonly token: string;
}

export class VerifyEmailUseCase implements UseCase<VerifyEmailInput, PublicUser> {
  public constructor(
    private readonly authTokens: AuthTokenRepository,
    private readonly users: UserRepository,
    private readonly tokenDigest: TokenDigest,
    private readonly clock: Clock,
  ) {}

  public async execute(input: VerifyEmailInput): Promise<PublicUser> {
    const raw = input.token.trim();

    if (raw.length === 0) {
      throw new AuthTokenInvalidError();
    }

    const token = await this.authTokens.findByTokenHash(this.tokenDigest.hash(raw));
    const now = this.clock.now();

    if (!token || token.purpose !== AuthTokenPurpose.EMAIL_VERIFICATION) {
      throw new AuthTokenInvalidError();
    }

    const consumed = token.consume(now);
    const user = await this.users.findById(consumed.userId);

    if (!user?.isActive()) {
      throw new AuthTokenInvalidError();
    }

    const verified = user.verifyEmail(now);
    await this.authTokens.save(consumed);
    await this.users.save(verified);
    return toPublicUser(verified);
  }
}
