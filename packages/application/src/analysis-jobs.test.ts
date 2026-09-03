import { describe, expect, it } from 'vitest';
import {
  AnalysisJobStatus,
  AnalysisRunStatus,
  ArticleStatus,
  Category,
  CitationVerificationStatus,
  MetricType,
  ScoringPolicy,
  Slug,
  SourceType,
  asArticleId,
  asArticleVersionId,
  asCategoryId,
} from '@aip/domain';
import { hashArticlePayload } from './content-hashing';
import { ANALYSIS_JOB_POLICY } from './analysis-job-policy';
import { ArticleClassificationService } from './article-classification';
import { FakeAnalysisService } from './fake-analysis-service';
import { FakeArticleAnalyzer } from './fake-article-analyzer';
import { PipelineArticleAnalyzer } from './pipeline-article-analyzer';
import {
  FakePasswordHasher,
  FakeTokenDigest,
  FixedClock,
  InMemoryAnalysisEvidenceRepository,
  InMemoryAnalysisJobRepository,
  InMemoryAnalysisMetricRepository,
  InMemoryAnalysisRunRepository,
  InMemoryScoreSnapshotRepository,
  InMemoryScoringPolicyRepository,
  InMemorySourceReferenceRepository,
  InMemoryAuditLogRepository,
  InMemoryArticleRepository,
  InMemoryArticleTaxonomyRepository,
  InMemoryArticleVersionRepository,
  InMemoryAuthTokenRepository,
  InMemoryCategoryRepository,
  InMemoryProfileRepository,
  InMemoryTagRepository,
  InMemoryUserRepository,
  MemoryEmailSender,
  MemoryRateLimiter,
  SequentialIdGenerator,
  SequentialTokenGenerator,
} from './fakes';
import { NoOpJobDispatcher } from './noop-job-dispatcher';
import { CreateArticleDraftUseCase } from './use-cases/create-article-draft';
import { ProcessAnalysisJobUseCase } from './use-cases/process-analysis-job';
import { RegisterUserUseCase } from './use-cases/register-user';
import { SubmitArticleUseCase } from './use-cases/submit-article';
import { VerifyEmailUseCase } from './use-cases/verify-email';
import type { ArticleAnalyzer, JobDispatchOptions, JobDispatcher } from './ports';

const NOW = new Date('2026-08-30T12:00:00.000Z');
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

function createAnalysisApp(
  analyzer: ArticleAnalyzer = new FakeArticleAnalyzer(),
  dispatcher: JobDispatcher = new NoOpJobDispatcher(),
  maxCostPerAnalysis = 1,
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
    articles,
    versions,
    categories,
    jobs,
    runs,
    metrics,
    evidence,
    sources,
    snapshots,
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
      maxCostPerAnalysis,
    ),
  };
}

async function submitDraft(app: ReturnType<typeof createAnalysisApp>) {
  const identity = await app.register.execute({
    email: 'ada@example.com',
    password: PASSWORD,
    displayName: 'ada-author',
    username: 'ada-author',
    appOrigin: APP,
  });
  const token = app.emails.messages.at(-1)?.text.match(/token=([^\s]+)/)?.[1];
  if (!token) {
    throw new Error('expected verification token');
  }
  await app.verify.execute({ token });

  const category = Category.create({
    id: asCategoryId(app.ids.next()),
    name: 'Computer Science',
    slug: Slug.from('computer-science'),
    now: NOW,
  });
  await app.categories.save(category);

  const created = await app.create.execute({
    actorUserId: identity.user.id,
    title: 'Queued Analysis',
    abstract: 'Abstract',
    content: BODY,
    language: 'en',
    categoryIds: [category.id],
  });
  const submitted = await app.submit.execute({
    actorUserId: identity.user.id,
    articleId: created.id,
  });

  return { created, submitted };
}

describe('ProcessAnalysisJobUseCase', () => {
  it('dispatches an analyze-article job on submit without calculating scores', async () => {
    const dispatcher = new RecordingJobDispatcher();
    const app = createAnalysisApp(new FakeArticleAnalyzer(), dispatcher);
    const { submitted } = await submitDraft(app);

    expect(submitted.status).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(dispatcher.calls).toHaveLength(1);
    expect(dispatcher.calls[0]?.name).toBe('analyze-article');
    expect(dispatcher.calls[0]?.payload).toEqual({ analysisJobId: expect.any(String) });
    expect(submitted).not.toHaveProperty('overallScore');
  });

  it('completes a fake analysis run bound to the article version', async () => {
    const app = createAnalysisApp();
    const { submitted } = await submitDraft(app);
    const job = await app.jobs.findActiveByArticleVersionId(
      (await app.articles.findById(asArticleId(submitted.id)))!.currentVersionId,
    );

    const result = await app.process.execute({ analysisJobId: job!.id });
    const article = await app.articles.findById(asArticleId(submitted.id));
    const runs = await app.runs.listByArticleVersionId(article!.currentVersionId);

    expect(result.outcome).toBe('completed');
    expect(result.articleStatus).toBe(ArticleStatus.ANALYSIS_COMPLETED);
    expect(result.jobStatus).toBe(AnalysisJobStatus.COMPLETED);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.status).toBe(AnalysisRunStatus.COMPLETED);
    expect(runs[0]?.modelProvider).toBe('fake');
    expect(runs[0]?.isBoundTo(article!.currentVersionId)).toBe(true);
    expect(await app.snapshots.findLatestByArticleVersionId(article!.currentVersionId)).toBeNull();
  });

  it('is idempotent when the same job is processed twice', async () => {
    const app = createAnalysisApp();
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const first = await app.process.execute({ analysisJobId: job!.id });
    const second = await app.process.execute({ analysisJobId: job!.id });
    const runs = await app.runs.listByArticleVersionId(article!.currentVersionId);

    expect(first.outcome).toBe('completed');
    expect(second.outcome).toBe('ignored');
    expect(runs).toHaveLength(1);
    expect((await app.articles.findById(asArticleId(submitted.id)))?.status).toBe(
      ArticleStatus.ANALYSIS_COMPLETED,
    );
  });

  it('retries a retryable analyzer failure and then succeeds', async () => {
    const analyzer = new FakeArticleAnalyzer({
      reason: 'temporary provider timeout',
      retryable: true,
      times: 1,
    });
    const app = createAnalysisApp(analyzer);
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const retried = await app.process.execute({ analysisJobId: job!.id });
    expect(retried.outcome).toBe('retried');
    expect(retried.articleStatus).toBe(ArticleStatus.PROCESSING);
    expect(retried.jobStatus).toBe(AnalysisJobStatus.QUEUED);

    const due = await app.jobs.findDueQueued(NOW, 10);
    expect(due).toHaveLength(0);

    app.clock.advance(ANALYSIS_JOB_POLICY.retryDelayMs);
    const dueLater = await app.jobs.findDueQueued(app.clock.now(), 10);
    expect(dueLater).toHaveLength(1);

    const completed = await app.process.execute({ analysisJobId: job!.id });
    expect(completed.outcome).toBe('completed');
    expect(completed.articleStatus).toBe(ArticleStatus.ANALYSIS_COMPLETED);
    expect((await app.jobs.findById(job!.id))?.attemptCount).toBe(2);
  });

  it('marks the article failed after max retryable attempts', async () => {
    const analyzer = new FakeArticleAnalyzer({
      reason: 'provider timeout',
      retryable: true,
      times: ANALYSIS_JOB_POLICY.maxAttempts,
    });
    const app = createAnalysisApp(analyzer);
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    expect((await app.process.execute({ analysisJobId: job!.id })).outcome).toBe('retried');
    expect((await app.process.execute({ analysisJobId: job!.id })).outcome).toBe('retried');
    const last = await app.process.execute({ analysisJobId: job!.id });

    expect(last.outcome).toBe('failed');
    expect(last.articleStatus).toBe(ArticleStatus.ANALYSIS_FAILED);
    expect(last.jobStatus).toBe(AnalysisJobStatus.FAILED);
    expect(await app.runs.listByArticleVersionId(article!.currentVersionId)).toHaveLength(0);
  });

  it('cancels a job when the article version is no longer current', async () => {
    const app = createAnalysisApp();
    const { submitted } = await submitDraft(app);
    const article = (await app.articles.findById(asArticleId(submitted.id)))!;
    const job = (await app.jobs.findActiveByArticleVersionId(article.currentVersionId))!;
    const revision = article.revise({
      versionId: asArticleVersionId(app.ids.next()),
      title: 'Queued Analysis',
      abstract: 'Abstract',
      content: `${BODY} Revised after queue.`,
      contentHash: hashArticlePayload({
        title: 'Queued Analysis',
        abstract: 'Abstract',
        content: `${BODY} Revised after queue.`,
      }),
      now: NOW,
    });
    await app.articles.save(revision.article);
    await app.versions.save(revision.version);

    const result = await app.process.execute({ analysisJobId: job.id });

    expect(result.outcome).toBe('ignored');
    expect(result.jobStatus).toBe(AnalysisJobStatus.CANCELLED);
    expect((await app.articles.findById(asArticleId(submitted.id)))?.status).toBe(ArticleStatus.DRAFT);
  });

  it('persists ScoreSnapshot through ScoringEngine and fails closed on incomplete metrics', async () => {
    const completeAnalyzer = new PipelineArticleAnalyzer({
      async run(input) {
        expect(input.language).toBe('en');
        expect(input.contentHash).toHaveLength(64);
        expect(input.content).toBe(BODY);
        expect(input.categories).toContain('Computer Science');
        return {
          ok: true,
          pipelineVersion: 'analysis-pipeline-score-1',
          promptVersion: 'prompt-bundle-authorship-1',
          modelProvider: 'fake',
          modelName: 'deterministic',
          tokenUsage: 20,
          estimatedCost: 0,
          articleType: 'technical',
          detectedTopics: ['evaluation'],
          metrics: completeMetricDrafts(),
          evidence: [
            {
              metricType: 'STRUCTURE',
              evidenceType: 'article-type',
              claim: 'technical',
              evidence: 'Methods language without a full empirical design.',
            },
            {
              metricType: 'EVIDENCE',
              evidenceType: 'source-collection',
              claim: 'Collected source',
              evidence: 'Example paper',
              sourceUrl: 'https://example.org/paper',
              sourceTitle: 'Example paper',
              reliability: 70,
            },
          ],
          sources: [
            {
              url: 'https://example.org/paper',
              title: 'Example paper',
              publisher: null,
              doi: null,
              sourceType: SourceType.WEB,
              verificationStatus: CitationVerificationStatus.PARTIALLY_VERIFIED,
              reliabilityScore: 70,
            },
          ],
        };
      },
    });
    const app = createAnalysisApp(completeAnalyzer);
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const result = await app.process.execute({ analysisJobId: job!.id });
    const run = (await app.runs.listByArticleVersionId(article!.currentVersionId))[0];
    const snapshot = await app.snapshots.findByAnalysisRunId(run!.id);

    expect(result.outcome).toBe('completed');
    expect(run?.pipelineVersion).toBe('analysis-pipeline-score-1');
    expect(run?.promptVersion).toBe('prompt-bundle-authorship-1');
    expect((await app.metrics.listByAnalysisRunId(run!.id)).map((metric) => metric.metricType)).toEqual([
      MetricType.STRUCTURE,
      MetricType.CONTENT_QUALITY,
      MetricType.TOPIC_RELEVANCE,
      MetricType.CITATION_QUALITY,
      MetricType.EVIDENCE,
      MetricType.FACTUAL_RELIABILITY,
      MetricType.ORIGINALITY,
      MetricType.AI_AUTHORSHIP_RISK,
    ]);
    expect(snapshot?.isBoundTo(article!.currentVersionId)).toBe(true);
    expect(snapshot?.scoringPolicyVersion).toBe('v1');
    expect(snapshot?.qualityScore.value).toBe(80);
    expect(snapshot?.overallScore.value).toBeGreaterThan(0);
    expect(submitted).not.toHaveProperty('overallScore');
    expect(run).not.toHaveProperty('overallScore');
  });

  it('fails closed when required score metrics are missing', async () => {
    const analyzer = new PipelineArticleAnalyzer({
      async run() {
        return {
          ok: true,
          pipelineVersion: 'analysis-pipeline-score-1',
          promptVersion: 'prompt-bundle-authorship-1',
          modelProvider: 'fake',
          modelName: 'deterministic',
          tokenUsage: 20,
          estimatedCost: 0,
          metrics: [
            {
              metricType: 'STRUCTURE',
              score: 74,
              confidence: 70,
              explanation: 'Meets the technical structure policy.',
            },
          ],
        };
      },
    });
    const app = createAnalysisApp(analyzer);
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const result = await app.process.execute({ analysisJobId: job!.id });

    expect(result.outcome).toBe('failed');
    expect(result.articleStatus).toBe(ArticleStatus.ANALYSIS_FAILED);
    expect(await app.snapshots.findLatestByArticleVersionId(article!.currentVersionId)).toBeNull();
  });

  it('lets only one concurrent claim complete the job', async () => {
    const app = createAnalysisApp();
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const [first, second] = await Promise.all([
      app.process.execute({ analysisJobId: job!.id }),
      app.process.execute({ analysisJobId: job!.id }),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual(['completed', 'ignored']);
    expect(await app.runs.listByArticleVersionId(article!.currentVersionId)).toHaveLength(1);
  });

  it('fails the job when estimated AI cost exceeds the budget', async () => {
    const analyzer: ArticleAnalyzer = {
      async analyze() {
        return {
          ok: true,
          pipelineVersion: 'fake-pipeline-1',
          promptVersion: 'fake-prompt-1',
          modelProvider: 'fake',
          modelName: 'deterministic',
          tokenUsage: 10_000,
          estimatedCost: 2,
        };
      },
    };
    const app = createAnalysisApp(analyzer, new NoOpJobDispatcher(), 1);
    const { submitted } = await submitDraft(app);
    const article = await app.articles.findById(asArticleId(submitted.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);

    const result = await app.process.execute({ analysisJobId: job!.id });

    expect(result.outcome).toBe('failed');
    expect(result.articleStatus).toBe(ArticleStatus.ANALYSIS_FAILED);
    expect(await app.runs.listByArticleVersionId(article!.currentVersionId)).toHaveLength(0);
  });
});

function completeMetricDrafts() {
  return [
    {
      metricType: MetricType.STRUCTURE,
      score: 80,
      confidence: 70,
      explanation: 'Structure meets the technical policy.',
    },
    {
      metricType: MetricType.CONTENT_QUALITY,
      score: 80,
      confidence: 70,
      explanation: 'Content quality is adequate.',
    },
    {
      metricType: MetricType.TOPIC_RELEVANCE,
      score: 80,
      confidence: 70,
      explanation: 'Topics align with the selected category.',
    },
    {
      metricType: MetricType.CITATION_QUALITY,
      score: 80,
      confidence: 70,
      explanation: 'Citations are internally consistent.',
    },
    {
      metricType: MetricType.EVIDENCE,
      score: 80,
      confidence: 70,
      explanation: 'Collected sources support the claims.',
    },
    {
      metricType: MetricType.FACTUAL_RELIABILITY,
      score: 80,
      confidence: 70,
      explanation: 'Unverified claims are not treated as false.',
    },
    {
      metricType: MetricType.ORIGINALITY,
      score: 80,
      confidence: 70,
      explanation: 'Internal uniqueness is adequate.',
    },
    {
      metricType: MetricType.AI_AUTHORSHIP_RISK,
      score: 20,
      confidence: 80,
      explanation: 'Ensemble produced a risk estimate, not a verdict.',
    },
  ] as const;
}
