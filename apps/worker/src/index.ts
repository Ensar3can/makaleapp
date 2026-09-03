import { toAnalyzerOutcome } from '@aip/ai';
import {
  ANALYZE_ARTICLE_JOB,
  PipelineArticleAnalyzer,
  ProcessAnalysisJobUseCase,
  isAnalyzeArticlePayload,
} from '@aip/application';
import { getConfig } from '@aip/config';
import {
  PrismaAiUsageRecordRepository,
  PrismaAnalysisEvidenceRepository,
  PrismaAnalysisJobRepository,
  PrismaObservabilityRepository,
  PrismaOperationalEventRepository,
  PrismaAnalysisMetricRepository,
  PrismaAnalysisRunRepository,
  PrismaArticleRepository,
  PrismaArticleTaxonomyRepository,
  PrismaArticleVersionRepository,
  PrismaCategoryRepository,
  PrismaScoreSnapshotRepository,
  PrismaScoringPolicyRepository,
  PrismaSourceReferenceRepository,
  PrismaAuditLogRepository,
  PrismaTagRepository,
  disconnectPrismaClient,
  getPrismaClient,
  probeDatabase,
  probeRedis,
} from '@aip/database';
import { createWorkerPipeline } from './create-worker-pipeline';
import { createLogger } from '@aip/logging';
import { createJobTransport } from '@aip/queue';
import { createObjectStorageFromConfig } from '@aip/storage';

const POLL_INTERVAL_MS = 2_000;
const DUE_BATCH_SIZE = 10;
const logger = createLogger({ service: 'worker' });

class SystemClock {
  public now(): Date {
    return new Date();
  }
}

class UuidGenerator {
  public next(): string {
    return crypto.randomUUID();
  }
}

async function start(): Promise<void> {
  const config = getConfig();
  const storage = createObjectStorageFromConfig(config);
  const prisma = getPrismaClient();
  const articles = new PrismaArticleRepository(prisma);
  const versions = new PrismaArticleVersionRepository(prisma);
  const jobs = new PrismaAnalysisJobRepository(prisma);
  const runs = new PrismaAnalysisRunRepository(prisma);
  const metrics = new PrismaAnalysisMetricRepository(prisma);
  const evidence = new PrismaAnalysisEvidenceRepository(prisma);
  const sources = new PrismaSourceReferenceRepository(prisma);
  const snapshots = new PrismaScoreSnapshotRepository(prisma);
  const policies = new PrismaScoringPolicyRepository(prisma);
  const taxonomy = new PrismaArticleTaxonomyRepository(prisma);
  const categories = new PrismaCategoryRepository(prisma);
  const tags = new PrismaTagRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);
  const usageRecords = new PrismaAiUsageRecordRepository(prisma);
  const operationalEvents = new PrismaOperationalEventRepository(prisma);
  const observability = new PrismaObservabilityRepository(prisma);
  const pipeline = createWorkerPipeline(config);
  const analyzer = new PipelineArticleAnalyzer({
    run: async (input) => toAnalyzerOutcome(await pipeline.run(input)),
  });
  const processJob = new ProcessAnalysisJobUseCase(
    articles,
    versions,
    jobs,
    runs,
    metrics,
    evidence,
    sources,
    snapshots,
    policies,
    taxonomy,
    categories,
    tags,
    auditLogs,
    analyzer,
    new UuidGenerator(),
    new SystemClock(),
    config.MAX_AI_COST_PER_ANALYSIS,
    usageRecords,
    operationalEvents,
  );
  const transport = createJobTransport(config.REDIS_URL);

  transport.worker.register(ANALYZE_ARTICLE_JOB, async (payload: unknown) => {
    if (!isAnalyzeArticlePayload(payload)) {
      logger.warn('ignored malformed analyze-article payload');
      return;
    }

    const started = Date.now();
    const result = await processJob.execute({ analysisJobId: payload.analysisJobId });
    logger.info('processed analyze-article job', {
      requestId: payload.analysisJobId,
      jobId: payload.analysisJobId,
      articleId: null,
      durationMs: Date.now() - started,
      status: result.jobStatus,
      outcome: result.outcome,
      articleStatus: result.articleStatus,
      jobStatus: result.jobStatus,
    });
  });

  const drainDue = async (): Promise<void> => {
    const due = await jobs.findDueQueued(new Date(), DUE_BATCH_SIZE);

    for (const job of due) {
      const started = Date.now();
      const result = await processJob.execute({ analysisJobId: job.id });
      logger.info('processed due analysis job', {
        jobId: job.id,
        articleId: job.articleId,
        durationMs: Date.now() - started,
        status: result.jobStatus,
        outcome: result.outcome,
        articleStatus: result.articleStatus,
        jobStatus: result.jobStatus,
      });
    }

    try {
      await observability.recordHeartbeat('worker', new Date());
    } catch (error: unknown) {
      logger.warn('worker heartbeat failed', {
        error: error instanceof Error ? error.message : 'Unknown heartbeat error',
      });
    }
  };

  const [sql, redis] = await Promise.all([
    probeDatabase(prisma),
    probeRedis(config.REDIS_URL),
  ]);

  await storage.put('worker/startup.txt', Buffer.from('started'), 'text/plain');
  await transport.worker.start();
  await drainDue();

  const poller = setInterval(() => {
    void drainDue().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown drain error';
      logger.error('due job drain failed', { error: message });
    });
  }, POLL_INTERVAL_MS);

  logger.info('worker ready', {
    sqlServer: sql.ok,
    redisDriver: redis.driver,
    objectStorage: config.OBJECT_STORAGE_DRIVER,
    queue: transport.driver,
    aiProvider: config.AI_PROVIDER,
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info('worker shutting down', { signal });
    clearInterval(poller);
    await transport.worker.stop();
    await transport.queue.close();
    await disconnectPrismaClient();
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT').then(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM').then(() => process.exit(0));
  });
}

start().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown worker startup error';
  logger.error('worker failed to start', { error: message });
  process.exitCode = 1;
});
