import { describe, expect, it } from 'vitest';
import { Score, ScoringPolicy } from '@aip/domain';
import { Prisma } from './generated/client';
import { scoringPolicyCreateData, toScoringPolicy } from './mappers';

describe('scoring policy persistence mapping', () => {
  it('round-trips ScoringPolicy.initial through JSON columns', () => {
    const policy = ScoringPolicy.initial();
    const now = new Date('2026-08-29T12:00:00.000Z');
    const created = scoringPolicyCreateData(policy, now, true);
    const reconstituted = toScoringPolicy({
      version: created.version,
      qualityWeights: created.qualityWeights,
      qualityWeight: created.qualityWeight,
      authorshipIntegrityWeight: created.authorshipIntegrityWeight,
      authorshipConfidenceThreshold: created.authorshipConfidenceThreshold,
      authorshipClassificationThresholds: created.authorshipClassificationThresholds,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(reconstituted.version).toBe('v1');
    expect(reconstituted.qualityWeights).toEqual(policy.qualityWeights);
    expect(reconstituted.qualityWeight).toBe(0.85);
    expect(reconstituted.authorshipIntegrityWeight).toBe(0.15);
    expect(reconstituted.authorshipConfidenceThreshold.equals(Score.from(60))).toBe(true);
    expect(created.qualityWeight).toBeInstanceOf(Prisma.Decimal);
  });
});
