import type {
  AnalysisMetric,
  AnalysisMetricId,
  AnalysisMetricRepository,
  AnalysisRunId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromScore, toAnalysisMetric } from '../mappers';

export class PrismaAnalysisMetricRepository implements AnalysisMetricRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AnalysisMetricId): Promise<AnalysisMetric | null> {
    const row = await this.prisma.analysisMetric.findUnique({ where: { id } });
    return row ? toAnalysisMetric(row) : null;
  }

  public async listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AnalysisMetric[]> {
    const rows = await this.prisma.analysisMetric.findMany({
      where: { analysisRunId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toAnalysisMetric);
  }

  public async saveMany(metrics: readonly AnalysisMetric[]): Promise<void> {
    for (const metric of metrics) {
      const data = {
        analysisRunId: metric.analysisRunId,
        metricType: metric.metricType,
        score: decimalFromScore(metric.score),
        confidence: decimalFromScore(metric.confidence),
        explanation: metric.explanation,
        createdAt: metric.createdAt,
      };

      await this.prisma.analysisMetric.upsert({
        where: { id: metric.id },
        create: { id: metric.id, ...data },
        update: data,
      });
    }
  }
}
