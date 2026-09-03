import type {
  AnalysisRun,
  AnalysisRunId,
  AnalysisRunRepository,
  ArticleVersionId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { decimalFromAmount, toAnalysisRun } from '../mappers';

export class PrismaAnalysisRunRepository implements AnalysisRunRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AnalysisRunId): Promise<AnalysisRun | null> {
    const row = await this.prisma.analysisRun.findUnique({ where: { id } });
    return row ? toAnalysisRun(row) : null;
  }

  public async listByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<readonly AnalysisRun[]> {
    const rows = await this.prisma.analysisRun.findMany({
      where: { articleVersionId },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toAnalysisRun);
  }

  public async listByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly AnalysisRun[]> {
    if (articleVersionIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.analysisRun.findMany({
      where: { articleVersionId: { in: [...articleVersionIds] } },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(toAnalysisRun);
  }

  public async save(run: AnalysisRun): Promise<void> {
    const data = {
      articleId: run.articleId,
      articleVersionId: run.articleVersionId,
      status: run.status,
      pipelineVersion: run.pipelineVersion,
      promptVersion: run.promptVersion,
      modelProvider: run.modelProvider,
      modelName: run.modelName,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      tokenUsage: run.tokenUsage,
      estimatedCost: run.estimatedCost === null ? null : decimalFromAmount(run.estimatedCost, 6),
      createdAt: run.createdAt,
    };

    await this.prisma.analysisRun.upsert({
      where: { id: run.id },
      create: { id: run.id, ...data },
      update: data,
    });
  }
}
