import type { SessionRepository } from '@aip/domain';
import type { Clock, TokenDigest } from '../ports';
import type { UseCase } from '../use-case';

export interface LogoutUserInput {
  readonly sessionToken: string | null | undefined;
}

export class LogoutUserUseCase implements UseCase<LogoutUserInput, void> {
  public constructor(
    private readonly sessions: SessionRepository,
    private readonly tokenDigest: TokenDigest,
    private readonly clock: Clock,
  ) {}

  public async execute(input: LogoutUserInput): Promise<void> {
    const token = input.sessionToken?.trim();

    if (!token) {
      return;
    }

    const session = await this.sessions.findByTokenHash(this.tokenDigest.hash(token));

    if (!session) {
      return;
    }

    await this.sessions.save(session.revoke(this.clock.now()));
  }
}
