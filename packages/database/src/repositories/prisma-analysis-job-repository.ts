import {
  AnalysisJobStatus,
  type AnalysisJob,
  type AnalysisJobId,
  type AnalysisJobRepository,
  type ArticleVersionId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toAnalysisJob } from '../mappers';

const ACTIVE_JOB_STATUSES = [AnalysisJobStatus.QUEUED, AnalysisJobStatus.RUNNING] as const;

export class PrismaAnalysisJobRepository implements AnalysisJobRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AnalysisJobId): Promise<AnalysisJob | null> {
    const row = await this.prisma.analysisJob.findUnique({ where: { id } });
    return row ? toAnalysisJob(row) : null;
  }

  public async findActiveByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<AnalysisJob | null> {
    const row = await this.prisma.analysisJob.findFirst({
      where: {
        articleVersionId,
        status: { in: [...ACTIVE_JOB_STATUSES] },
      },
      orderBy: { queuedAt: 'desc' },
    });

    return row ? toAnalysisJob(row) : null;
  }

  public async findDueQueued(now: Date, limit: number): Promise<readonly AnalysisJob[]> {
    const rows = await this.prisma.analysisJob.findMany({
      where: {
        status: AnalysisJobStatus.QUEUED,
        queuedAt: { lte: now },
      },
      orderBy: { queuedAt: 'asc' },
      take: limit,
    });

    return rows.map(toAnalysisJob);
  }

  public async save(job: AnalysisJob): Promise<void> {
    const data = toJobWriteData(job);

    await this.prisma.analysisJob.upsert({
      where: { id: job.id },
      create: { id: job.id, ...data },
      update: data,
    });
  }

  public async saveIfStatus(job: AnalysisJob, expectedStatus: AnalysisJobStatus): Promise<boolean> {
    const result = await this.prisma.analysisJob.updateMany({
      where: { id: job.id, status: expectedStatus },
      data: toJobWriteData(job),
    });

    return result.count === 1;
  }
}

function toJobWriteData(job: AnalysisJob) {
  return {
    articleId: job.articleId,
    articleVersionId: job.articleVersionId,
    status: job.status,
    attemptCount: job.attemptCount,
    queuedAt: job.queuedAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    failureReason: job.failureReason,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
