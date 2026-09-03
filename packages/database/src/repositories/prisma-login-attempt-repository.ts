import type { EmailAddress, LoginAttempt, LoginAttemptRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toLoginAttempt } from '../mappers';

export class PrismaLoginAttemptRepository implements LoginAttemptRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async record(attempt: LoginAttempt): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        id: attempt.id,
        email: attempt.email.value,
        succeeded: attempt.succeeded,
        createdAt: attempt.createdAt,
      },
    });
  }

  public async listRecentByEmail(email: EmailAddress, since: Date): Promise<readonly LoginAttempt[]> {
    const rows = await this.prisma.loginAttempt.findMany({
      where: { email: email.value, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toLoginAttempt);
  }
}
