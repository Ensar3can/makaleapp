import type { ScoringPolicy, ScoringPolicyRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { scoringPolicyCreateData, scoringPolicyUpdateData, toScoringPolicy } from '../mappers';

export class PrismaScoringPolicyRepository implements ScoringPolicyRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findByVersion(version: string): Promise<ScoringPolicy | null> {
    const row = await this.prisma.scoringPolicy.findUnique({ where: { version } });
    return row ? toScoringPolicy(row) : null;
  }

  public async findActive(): Promise<ScoringPolicy | null> {
    const row = await this.prisma.scoringPolicy.findFirst({ where: { isActive: true } });
    return row ? toScoringPolicy(row) : null;
  }

  public async save(policy: ScoringPolicy): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.scoringPolicy.updateMany({ data: { isActive: false } });
      await tx.scoringPolicy.upsert({
        where: { version: policy.version },
        create: scoringPolicyCreateData(policy, now, true),
        update: scoringPolicyUpdateData(policy, now, true),
      });
    });
  }
}
