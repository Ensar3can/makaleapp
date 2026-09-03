import type {
  AnalysisEvidence,
  AnalysisEvidenceId,
  AnalysisEvidenceRepository,
  AnalysisRunId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromAmount, toAnalysisEvidence } from '../mappers';

export class PrismaAnalysisEvidenceRepository implements AnalysisEvidenceRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AnalysisEvidenceId): Promise<AnalysisEvidence | null> {
    const row = await this.prisma.analysisEvidence.findUnique({ where: { id } });
    return row ? toAnalysisEvidence(row) : null;
  }

  public async listByAnalysisRunId(
    analysisRunId: AnalysisRunId,
  ): Promise<readonly AnalysisEvidence[]> {
    const rows = await this.prisma.analysisEvidence.findMany({
      where: { analysisRunId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toAnalysisEvidence);
  }

  public async listByAnalysisRunIds(
    analysisRunIds: readonly AnalysisRunId[],
  ): Promise<readonly AnalysisEvidence[]> {
    if (analysisRunIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.analysisEvidence.findMany({
      where: { analysisRunId: { in: [...analysisRunIds] } },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toAnalysisEvidence);
  }

  public async saveMany(evidence: readonly AnalysisEvidence[]): Promise<void> {
    for (const item of evidence) {
      const data = {
        analysisRunId: item.analysisRunId,
        metricType: item.metricType,
        evidenceType: item.evidenceType,
        claim: item.claim,
        evidence: item.evidence,
        sourceUrl: item.sourceUrl,
        sourceTitle: item.sourceTitle,
        reliability: item.reliability === null ? null : decimalFromAmount(item.reliability, 2),
        createdAt: item.createdAt,
      };

      await this.prisma.analysisEvidence.upsert({
        where: { id: item.id },
        create: { id: item.id, ...data },
        update: data,
      });
    }
  }
}
