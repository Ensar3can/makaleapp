import {
  type AiUsageRecord,
  type AiUsageRecordId,
  type AiUsageRecordRepository,
  type AnalysisRunId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromAmount, toAiUsageRecord } from '../mappers';

export class PrismaAiUsageRecordRepository implements AiUsageRecordRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AiUsageRecordId): Promise<AiUsageRecord | null> {
    const row = await this.prisma.aiUsageRecord.findUnique({ where: { id } });
    return row ? toAiUsageRecord(row) : null;
  }

  public async listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AiUsageRecord[]> {
    const rows = await this.prisma.aiUsageRecord.findMany({
      where: { analysisRunId },
      orderBy: { recordedAt: 'asc' },
    });
    return rows.map(toAiUsageRecord);
  }

  public async saveMany(records: readonly AiUsageRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }

    await this.prisma.aiUsageRecord.createMany({
      data: records.map((record) => ({
        id: record.id,
        analysisRunId: record.analysisRunId,
        provider: record.provider,
        model: record.model,
        promptId: record.promptId,
        promptVersion: record.promptVersion,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        estimatedCost: decimalFromAmount(record.estimatedCost, 6),
        latencyMs: record.latencyMs,
        recordedAt: record.recordedAt,
      })),
    });
  }
}
