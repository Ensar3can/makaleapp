import type { UsageRecord, UsageTotals, UsageTracker } from './types';

export class InMemoryUsageTracker implements UsageTracker {
  private readonly records: UsageRecord[] = [];

  public record(entry: Omit<UsageRecord, 'recordedAt'> & { recordedAt?: Date }): void {
    this.records.push({
      ...entry,
      recordedAt: entry.recordedAt ?? new Date(),
    });
  }

  public list(): readonly UsageRecord[] {
    return [...this.records];
  }

  public totals(): UsageTotals {
    return this.records.reduce<UsageTotals>(
      (sum, record) => ({
        tokenUsage: sum.tokenUsage + record.inputTokens + record.outputTokens,
        estimatedCost: sum.estimatedCost + record.estimatedCost,
        callCount: sum.callCount + 1,
      }),
      { tokenUsage: 0, estimatedCost: 0, callCount: 0 },
    );
  }
}
