import { UnauthenticatedError, type ProfileRepository, type SessionRepository, type UserRepository } from '@aip/domain';
import type { Clock, TokenDigest } from '../ports';
import { toAuthenticatedIdentity, type AuthenticatedIdentity } from '../public-identity';
import type { UseCase } from '../use-case';

export interface ResolveSessionInput {
  readonly sessionToken: string | null | undefined;
}

export interface ResolvedSession extends AuthenticatedIdentity {
  readonly userId: string;
}

export class ResolveSessionUseCase implements UseCase<ResolveSessionInput, ResolvedSession> {
  public constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly profiles: ProfileRepository,
    private readonly tokenDigest: TokenDigest,
    private readonly clock: Clock,
  ) {}

  public async execute(input: ResolveSessionInput): Promise<ResolvedSession> {
    const token = input.sessionToken?.trim();

    if (!token) {
      throw new UnauthenticatedError();
    }

    const session = await this.sessions.findByTokenHash(this.tokenDigest.hash(token));
    const now = this.clock.now();

    if (!session || !session.isActive(now)) {
      throw new UnauthenticatedError();
    }

    const user = await this.users.findById(session.userId);

    if (!user?.isActive()) {
      throw new UnauthenticatedError();
    }

    const profile = await this.profiles.findByUserId(user.id);
    return {
      ...toAuthenticatedIdentity(user, profile),
      userId: user.id,
    };
  }
}
