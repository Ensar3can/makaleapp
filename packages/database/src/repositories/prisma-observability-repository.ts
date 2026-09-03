import {
  AnalysisJobStatus,
  AnalysisRunStatus,
  ArticleStatus,
  OperationalEventKind,
  analysisDurationMs,
  startOfUtcDay,
  startOfUtcMonth,
  type MonitoredJobQuery,
  type MonitoredJobRecord,
  type ObservabilityRawSnapshot,
  type ObservabilityRepository,
  type ObservabilityStageCost,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { numberFromDecimal, toAnalysisJob, toAnalysisRun, toOperationalEvent } from '../mappers';

const WORKER_COMPONENT = 'worker';

export class PrismaObservabilityRepository implements ObservabilityRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async loadDashboard(now: Date): Promise<ObservabilityRawSnapshot> {
    const today = startOfUtcDay(now);
    const month = startOfUtcMonth(now);
    const [
      jobGroups,
      completedJobs,
      runGroups,
      completedRuns,
      costToday,
      costMonth,
      reviewCount,
      providerFailures,
      stageGroups,
      recentErrors,
      heartbeat,
    ] = await Promise.all([
      this.prisma.analysisJob.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.analysisJob.findMany({
        where: {
          status: AnalysisJobStatus.COMPLETED,
          startedAt: { not: null },
          completedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
      }),
      this.prisma.analysisRun.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.analysisRun.findMany({
        where: { status: AnalysisRunStatus.COMPLETED },
        select: { tokenUsage: true, estimatedCost: true },
      }),
      this.prisma.analysisRun.aggregate({
        where: { status: AnalysisRunStatus.COMPLETED, createdAt: { gte: today } },
        _sum: { estimatedCost: true },
      }),
      this.prisma.analysisRun.aggregate({
        where: { status: AnalysisRunStatus.COMPLETED, createdAt: { gte: month } },
        _sum: { estimatedCost: true },
      }),
      this.prisma.article.count({ where: { status: ArticleStatus.REQUIRES_REVIEW } }),
      this.prisma.operationalEvent.count({
        where: { kind: OperationalEventKind.AI_PROVIDER_FAILURE },
      }),
      this.prisma.aiUsageRecord.groupBy({
        by: ['promptId'],
        _sum: { estimatedCost: true },
        _count: { _all: true },
      }),
      this.prisma.operationalEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.systemHeartbeat.findUnique({ where: { component: WORKER_COMPONENT } }),
    ]);

    const jobCount = (status: string) =>
      jobGroups.find((group) => group.status === status)?._count._all ?? 0;
    const runCount = (status: string) =>
      runGroups.find((group) => group.status === status)?._count._all ?? 0;
    const expensiveStages: ObservabilityStageCost[] = stageGroups
      .map((group) => ({
        promptId: group.promptId,
        totalCost: group._sum.estimatedCost ? numberFromDecimal(group._sum.estimatedCost) : 0,
        callCount: group._count._all,
      }))
      .sort((left, right) => right.totalCost - left.totalCost);
    return {
      jobsQueued: jobCount(AnalysisJobStatus.QUEUED),
      jobsRunning: jobCount(AnalysisJobStatus.RUNNING),
      jobsFailed: jobCount(AnalysisJobStatus.FAILED),
      jobsCompleted: jobCount(AnalysisJobStatus.COMPLETED),
      completedDurationsMs: completedJobs.flatMap((job) => {
        const duration = analysisDurationMs(job.startedAt, job.completedAt);
        return duration === null ? [] : [duration];
      }),
      completedRunCount: runCount(AnalysisRunStatus.COMPLETED),
      failedRunCount: runCount(AnalysisRunStatus.FAILED),
      tokenUsageSum: completedRuns.reduce((sum, run) => sum + (run.tokenUsage ?? 0), 0),
      tokenUsageCount: completedRuns.filter((run) => run.tokenUsage !== null).length,
      costToday: costToday._sum.estimatedCost ? numberFromDecimal(costToday._sum.estimatedCost) : 0,
      costThisMonth: costMonth._sum.estimatedCost ? numberFromDecimal(costMonth._sum.estimatedCost) : 0,
      costCompletedSum: completedRuns.reduce(
        (sum, run) => sum + (run.estimatedCost ? numberFromDecimal(run.estimatedCost) : 0),
        0,
      ),
      costCompletedCount: completedRuns.filter((run) => run.estimatedCost !== null).length,
      articlesRequiringReview: reviewCount,
      aiProviderFailureCount: providerFailures,
      expensiveStages,
      recentErrors: recentErrors.map(toOperationalEvent),
      workerHeartbeatAt: heartbeat?.lastSeenAt ?? null,
    };
  }

  public async listJobs(query: MonitoredJobQuery): Promise<readonly MonitoredJobRecord[]> {
    const rows = await this.prisma.analysisJob.findMany({
      where: query.status ? { status: query.status } : undefined,
      orderBy: { updatedAt: 'desc' },
      take: query.limit,
      include: {
        articleVersion: { select: { title: true } },
      },
    });
    const versionIds = [...new Set(rows.map((row) => row.articleVersionId))];
    const runs = await this.prisma.analysisRun.findMany({
      where: { articleVersionId: { in: versionIds } },
      orderBy: { createdAt: 'desc' },
    });
    const runByVersion = new Map<string, (typeof runs)[number]>();

    for (const run of runs) {
      if (!runByVersion.has(run.articleVersionId)) {
        runByVersion.set(run.articleVersionId, run);
      }
    }

    return rows.map((row) => {
      const run = runByVersion.get(row.articleVersionId);
      return {
        job: toAnalysisJob(row),
        title: row.articleVersion.title,
        run: run ? toAnalysisRun(run) : null,
      };
    });
  }

  public async recordHeartbeat(component: string, now: Date): Promise<void> {
    await this.prisma.systemHeartbeat.upsert({
      where: { component },
      create: { component, lastSeenAt: now, status: 'ok' },
      update: { lastSeenAt: now, status: 'ok' },
    });
  }
}
