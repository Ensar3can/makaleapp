import { describe, expect, it } from 'vitest';
import {
  AnalysisJobStatus,
  ArticleStatus,
  AuditAction,
  Category,
  InsufficientPermissionError,
  InvalidAnalysisJobStateError,
  Role,
  ScoringPolicy,
  Slug,
  asArticleId,
  asCategoryId,
  asUserId,
} from '@aip/domain';
import { ANALYSIS_JOB_POLICY } from './analysis-job-policy';
import { ArticleClassificationService } from './article-classification';
import { FakeAnalysisService } from './fake-analysis-service';
import { FakeArticleAnalyzer } from './fake-article-analyzer';
import {
  FakePasswordHasher,
  FakeTokenDigest,
  FixedClock,
  InMemoryAiUsageRecordRepository,
  InMemoryAnalysisEvidenceRepository,
  InMemoryAnalysisJobRepository,
  InMemoryAnalysisMetricRepository,
  InMemoryAnalysisRunRepository,
  InMemoryArticleRepository,
  InMemoryArticleTaxonomyRepository,
  InMemoryArticleVersionRepository,
  InMemoryAuditLogRepository,
  InMemoryAuthTokenRepository,
  InMemoryCategoryRepository,
  InMemoryObservabilityRepository,
  InMemoryOperationalEventRepository,
  InMemoryProfileRepository,
  InMemoryScoreSnapshotRepository,
  InMemoryScoringPolicyRepository,
  InMemorySourceReferenceRepository,
  InMemoryTagRepository,
  InMemoryUserRepository,
  MemoryEmailSender,
  MemoryRateLimiter,
  SequentialIdGenerator,
  SequentialTokenGenerator,
} from './fakes';
import { NoOpJobDispatcher } from './noop-job-dispatcher';
import type { ArticleAnalyzer, JobDispatchOptions, JobDispatcher } from './ports';
import { CreateArticleDraftUseCase } from './use-cases/create-article-draft';
import { GetObservabilityDashboardUseCase } from './use-cases/get-observability-dashboard';
import { ListMonitoredAnalysisJobsUseCase } from './use-cases/list-monitored-analysis-jobs';
import { ProcessAnalysisJobUseCase } from './use-cases/process-analysis-job';
import { RegisterUserUseCase } from './use-cases/register-user';
import { RetryFailedAnalysisJobUseCase } from './use-cases/retry-failed-analysis-job';
import { SubmitArticleUseCase } from './use-cases/submit-article';
import { VerifyEmailUseCase } from './use-cases/verify-email';

const NOW = new Date('2026-08-30T18:00:00.000Z');
const APP = 'http://localhost:3000';
const PASSWORD = 'AuthorPass1234';
const BODY = 'This methods section explains how evaluation binds to a version.';

class RecordingJobDispatcher implements JobDispatcher {
  public readonly calls: Array<{ name: string; payload: unknown; options?: JobDispatchOptions }> = [];

  public async dispatch(
    name: string,
    payload: unknown,
    options?: JobDispatchOptions,
  ): Promise<void> {
    this.calls.push({ name, payload, options });
  }
}

function createObservabilityApp(
  analyzer: ArticleAnalyzer = new FakeArticleAnalyzer(),
  dispatcher: JobDispatcher = new NoOpJobDispatcher(),
) {
  const users = new InMemoryUserRepository();
  const profiles = new InMemoryProfileRepository();
  const authTokens = new InMemoryAuthTokenRepository();
  const articles = new InMemoryArticleRepository();
  const versions = new InMemoryArticleVersionRepository();
  const categories = new InMemoryCategoryRepository();
  const tags = new InMemoryTagRepository();
  const taxonomy = new InMemoryArticleTaxonomyRepository();
  const jobs = new InMemoryAnalysisJobRepository();
  const runs = new InMemoryAnalysisRunRepository();
  const metrics = new InMemoryAnalysisMetricRepository();
  const evidence = new InMemoryAnalysisEvidenceRepository();
  const sources = new InMemorySourceReferenceRepository();
  const snapshots = new InMemoryScoreSnapshotRepository();
  const policies = new InMemoryScoringPolicyRepository(ScoringPolicy.initial());
  const auditLogs = new InMemoryAuditLogRepository();
  const usage = new InMemoryAiUsageRecordRepository();
  const events = new InMemoryOperationalEventRepository();
  const observability = new InMemoryObservabilityRepository(
    jobs,
    runs,
    articles,
    versions,
    usage,
    events,
  );
  const hasher = new FakePasswordHasher();
  const tokens = new SequentialTokenGenerator();
  const digest = new FakeTokenDigest();
  const ids = new SequentialIdGenerator();
  const clock = new FixedClock(NOW);
  const emails = new MemoryEmailSender();
  const rateLimiter = new MemoryRateLimiter();
  const classification = new ArticleClassificationService(categories, tags, taxonomy, ids, clock);
  const analysis = new FakeAnalysisService(articles, jobs, ids, dispatcher);

  return {
    users,
    articles,
    categories,
    jobs,
    runs,
    usage,
    events,
    auditLogs,
    emails,
    ids,
    clock,
    dispatcher,
    register: new RegisterUserUseCase(
      users,
      profiles,
      authTokens,
      hasher,
      tokens,
      digest,
      ids,
      clock,
      emails,
      rateLimiter,
    ),
    verify: new VerifyEmailUseCase(authTokens, users, digest, clock),
    create: new CreateArticleDraftUseCase(users, articles, versions, classification, ids, clock),
    submit: new SubmitArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      classification,
      analysis,
      clock,
      rateLimiter,
    ),
    process: new ProcessAnalysisJobUseCase(
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
      ids,
      clock,
      1,
      usage,
      events,
    ),
    dashboard: new GetObservabilityDashboardUseCase(
      users,
      observability,
      {
        check: async () => ({ sqlServer: true, redis: true, objectStorage: true }),
      },
      clock,
    ),
    listJobs: new ListMonitoredAnalysisJobsUseCase(users, observability),
    retry: new RetryFailedAnalysisJobUseCase(
      users,
      articles,
      jobs,
      auditLogs,
      dispatcher,
      ids,
      clock,
      rateLimiter,
    ),
  };
}

async function registerVerified(
  app: ReturnType<typeof createObservabilityApp>,
  email: string,
  username: string,
) {
  const identity = await app.register.execute({
    email,
    password: PASSWORD,
    displayName: username,
    username,
    appOrigin: APP,
  });
  const token = app.emails.messages.at(-1)?.text.match(/token=([^\s]+)/)?.[1];

  if (!token) {
    throw new Error('expected verification token');
  }

  await app.verify.execute({ token });
  return identity;
}

async function promoteAdmin(app: ReturnType<typeof createObservabilityApp>, userId: string) {
  const user = await app.users.findById(asUserId(userId));

  if (!user) {
    throw new Error('user missing');
  }

  await app.users.save(user.assignRole(Role.ADMIN, Role.ADMIN, NOW));
}

async function submitDraft(app: ReturnType<typeof createObservabilityApp>, actorUserId: string) {
  const category = Category.create({
    id: asCategoryId(app.ids.next()),
    name: 'Computer Science',
    slug: Slug.from(`computer-science-${app.ids.next()}`),
    now: NOW,
  });
  await app.categories.save(category);
  const created = await app.create.execute({
    actorUserId,
    title: 'Queued Analysis',
    abstract: 'Abstract',
    content: BODY,
    language: 'en',
    categoryIds: [category.id],
  });
  return app.submit.execute({
    actorUserId,
    articleId: created.id,
  });
}

describe('observability use cases', () => {
  it('denies the dashboard to authors and grants it to admins', async () => {
    const app = createObservabilityApp();
    const author = await registerVerified(app, 'ada@example.com', 'ada-author');
    const admin = await registerVerified(app, 'admin@example.com', 'admin-user');
    await promoteAdmin(app, admin.user.id);

    await expect(app.dashboard.execute({ actorUserId: author.user.id })).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    );

    const view = await app.dashboard.execute({ actorUserId: admin.user.id });
    expect(view.jobsQueued).toBe(0);
    expect(view.infrastructure.sqlServer).toBe(true);
    expect(view).not.toHaveProperty('overallScore');
  });

  it('lists jobs and retries a failed analysis with authorization', async () => {
    const dispatcher = new RecordingJobDispatcher();
    const app = createObservabilityApp(
      new FakeArticleAnalyzer({
        reason: 'provider timeout',
        retryable: true,
        times: ANALYSIS_JOB_POLICY.maxAttempts,
      }),
      dispatcher,
    );
    const author = await registerVerified(app, 'ada@example.com', 'ada-author');
    const admin = await registerVerified(app, 'admin@example.com', 'admin-user');
    await promoteAdmin(app, admin.user.id);
    const submitted = await submitDraft(app, author.user.id);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    await app.process.execute({ analysisJobId: job!.id });
    await app.process.execute({ analysisJobId: job!.id });
    const failed = await app.process.execute({ analysisJobId: job!.id });

    expect(failed.outcome).toBe('failed');
    expect((await app.events.listRecent(10))[0]?.kind).toBe('ai_provider_failure');

    await expect(
      app.retry.execute({ actorUserId: author.user.id, analysisJobId: job!.id }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);

    const retried = await app.retry.execute({
      actorUserId: admin.user.id,
      analysisJobId: job!.id,
    });

    expect(retried.jobStatus).toBe(AnalysisJobStatus.QUEUED);
    expect(retried.articleStatus).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(dispatcher.calls.at(-1)?.name).toBe('analyze-article');

    const listed = await app.listJobs.execute({ actorUserId: admin.user.id });
    expect(listed[0]?.id).toBe(job!.id);
    expect(listed[0]?.status).toBe(AnalysisJobStatus.QUEUED);
    expect((await app.auditLogs.listByEntity('AnalysisJob', job!.id))[0]?.action).toBe(
      AuditAction.ANALYSIS_JOB_RETRIED,
    );

    await expect(
      app.retry.execute({ actorUserId: admin.user.id, analysisJobId: job!.id }),
    ).rejects.toBeInstanceOf(InvalidAnalysisJobStateError);
  });

  it('persists pipeline usage records when analysis completes', async () => {
    const app = createObservabilityApp({
      analyze: async () => ({
        ok: true,
        pipelineVersion: 'fake-pipeline-1',
        promptVersion: 'fake-prompt-1',
        modelProvider: 'fake',
        modelName: 'deterministic',
        tokenUsage: 20,
        estimatedCost: 0.02,
        usageRecords: [
          {
            provider: 'fake',
            model: 'deterministic',
            promptId: 'article-type-v1',
            promptVersion: 'v2',
            inputTokens: 12,
            outputTokens: 8,
            estimatedCost: 0.02,
            latencyMs: 15,
          },
        ],
      }),
    });
    const author = await registerVerified(app, 'ada@example.com', 'ada-author');
    const submitted = await submitDraft(app, author.user.id);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);
    await app.process.execute({ analysisJobId: job!.id });
    const runs = await app.runs.listByArticleVersionId(article!.currentVersionId);
    const records = await app.usage.listByAnalysisRunId(runs[0]!.id);

    expect(records).toHaveLength(1);
    expect(records[0]?.promptId).toBe('article-type-v1');
    expect(records[0]?.totalTokens).toBe(20);
  });
});
