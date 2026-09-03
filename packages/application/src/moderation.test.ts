import { describe, expect, it } from 'vitest';
import {
  ArticleStatus,
  Category,
  CitationVerificationStatus,
  InsufficientPermissionError,
  InvalidArticleStateError,
  MetricType,
  ModerationDecision,
  ModerationFlagCode,
  OPERATION_RATE_LIMITS,
  Role,
  ScoringPolicy,
  Slug,
  SourceType,
  asArticleId,
  asCategoryId,
  asUserId,
} from '@aip/domain';
import { ArticleClassificationService } from './article-classification';
import { FakeAnalysisService } from './fake-analysis-service';
import { PipelineArticleAnalyzer } from './pipeline-article-analyzer';
import {
  FakePasswordHasher,
  FakeTokenDigest,
  FixedClock,
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
  InMemoryModerationReviewRepository,
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
import { RateLimitedError } from './errors';
import { rateLimitKey } from './ports';
import { NoOpJobDispatcher } from './noop-job-dispatcher';
import { CreateArticleDraftUseCase } from './use-cases/create-article-draft';
import { FlagArticleUseCase } from './use-cases/flag-article';
import { GetModerationArticleUseCase } from './use-cases/get-moderation-article';
import { ListModerationQueueUseCase } from './use-cases/list-moderation-queue';
import { ModerateArticleUseCase } from './use-cases/moderate-article';
import { ProcessAnalysisJobUseCase } from './use-cases/process-analysis-job';
import { PublishArticleUseCase } from './use-cases/publish-article';
import { RegisterUserUseCase } from './use-cases/register-user';
import { SubmitArticleUseCase } from './use-cases/submit-article';
import { VerifyEmailUseCase } from './use-cases/verify-email';
import type { ArticleAnalyzer } from './ports';

const NOW = new Date('2026-08-30T16:00:00.000Z');
const APP = 'http://localhost:3000';
const PASSWORD = 'AuthorPass1234';
const BODY = 'This methods section explains how evaluation binds to a version.';

function createModerationApp(analyzer: ArticleAnalyzer) {
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
  const reviews = new InMemoryModerationReviewRepository();
  const auditLogs = new InMemoryAuditLogRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new SequentialTokenGenerator();
  const digest = new FakeTokenDigest();
  const ids = new SequentialIdGenerator();
  const clock = new FixedClock(NOW);
  const emails = new MemoryEmailSender();
  const rateLimiter = new MemoryRateLimiter();
  const classification = new ArticleClassificationService(categories, tags, taxonomy, ids, clock);
  const analysis = new FakeAnalysisService(articles, jobs, ids, new NoOpJobDispatcher());

  return {
    users,
    articles,
    jobs,
    rateLimiter,
    evidence,
    snapshots,
    emails,
    ids,
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
    ),
    publish: new PublishArticleUseCase(users, articles, versions, jobs, snapshots, classification, clock),
    queue: new ListModerationQueueUseCase(users, articles, versions, profiles, snapshots, runs, evidence),
    get: new GetModerationArticleUseCase(
      users,
      articles,
      versions,
      profiles,
      snapshots,
      runs,
      metrics,
      evidence,
      sources,
      reviews,
    ),
    moderate: new ModerateArticleUseCase(users, articles, reviews, auditLogs, ids, clock, rateLimiter),
    flag: new FlagArticleUseCase(users, articles, auditLogs, ids, clock, rateLimiter),
    async seedCategory() {
      const category = Category.create({
        id: asCategoryId(ids.next()),
        name: 'Computer Science',
        slug: Slug.from('computer-science'),
        now: NOW,
      });
      await categories.save(category);
      return category;
    },
  };
}

async function verifiedUser(
  app: ReturnType<typeof createModerationApp>,
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

async function promoteModerator(app: ReturnType<typeof createModerationApp>, userId: string) {
  const user = await app.users.findById(asUserId(userId));
  if (!user) {
    throw new Error('user missing');
  }
  await app.users.save(user.assignRole(Role.MODERATOR, Role.ADMIN, NOW));
}

function analyzerWithRisk(risk: number, confidence: number) {
  return new PipelineArticleAnalyzer({
    async run() {
      return {
        ok: true,
        pipelineVersion: 'analysis-pipeline-moderation-1',
        promptVersion: 'prompt-bundle-authorship-1',
        modelProvider: 'fake',
        modelName: 'deterministic',
        tokenUsage: 20,
        estimatedCost: 0,
        metrics: [
          ...qualityMetrics(),
          {
            metricType: MetricType.AI_AUTHORSHIP_RISK,
            score: risk,
            confidence,
            explanation: 'Ensemble produced a risk estimate, not a verdict.',
          },
        ],
        evidence: [],
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
}

function qualityMetrics() {
  return [
    MetricType.STRUCTURE,
    MetricType.CONTENT_QUALITY,
    MetricType.TOPIC_RELEVANCE,
    MetricType.CITATION_QUALITY,
    MetricType.EVIDENCE,
    MetricType.FACTUAL_RELIABILITY,
    MetricType.ORIGINALITY,
  ].map((metricType) => ({
    metricType,
    score: 80,
    confidence: 70,
    explanation: `${metricType} is adequate.`,
  }));
}

describe('moderation', () => {
  it('auto-flags high-confidence authorship risk into the review queue', async () => {
    const app = createModerationApp(analyzerWithRisk(91, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const category = await app.seedCategory();
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Flagged Methods',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    const article = await app.articles.findById(asArticleId(created.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);
    const result = await app.process.execute({ analysisJobId: job!.id });

    expect(result.articleStatus).toBe(ArticleStatus.REQUIRES_REVIEW);
    expect((await app.articles.findById(asArticleId(created.id)))?.status).toBe(ArticleStatus.REQUIRES_REVIEW);
    await expect(
      app.publish.execute({ actorUserId: author.user.id, articleId: created.id }),
    ).rejects.toThrow(InvalidArticleStateError);
  });

  it('does not flag a low-risk complete snapshot', async () => {
    const app = createModerationApp(analyzerWithRisk(20, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const category = await app.seedCategory();
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Ordinary Methods',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    const article = await app.articles.findById(asArticleId(created.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);
    const result = await app.process.execute({ analysisJobId: job!.id });

    expect(result.articleStatus).toBe(ArticleStatus.ANALYSIS_COMPLETED);
  });

  it('lets a moderator approve, request revision, or reject, and blocks authors (IDOR)', async () => {
    const app = createModerationApp(analyzerWithRisk(91, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const moderator = await verifiedUser(app, 'mod@example.com', 'lead-moderator');
    await promoteModerator(app, moderator.user.id);
    const category = await app.seedCategory();
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Queue Item',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    const article = await app.articles.findById(asArticleId(created.id));
    const job = await app.jobs.findActiveByArticleVersionId(article!.currentVersionId);
    await app.process.execute({ analysisJobId: job!.id });

    await expect(app.queue.execute({ actorUserId: author.user.id })).rejects.toThrow(
      InsufficientPermissionError,
    );
    await expect(
      app.moderate.execute({
        actorUserId: author.user.id,
        articleId: created.id,
        decision: ModerationDecision.APPROVE,
        reason: 'Looks fine to me',
      }),
    ).rejects.toThrow(InsufficientPermissionError);

    const queue = await app.queue.execute({ actorUserId: moderator.user.id });
    expect(queue).toHaveLength(1);
    expect(queue[0]?.flags.some((flag) => flag.code === ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK)).toBe(
      true,
    );
    expect(queue[0]?.overallScore).not.toBeNull();

    const detail = await app.get.execute({ actorUserId: moderator.user.id, articleId: created.id });
    expect(detail.score?.authorshipClassification).toBe('high');
    expect(detail.contentAnalysis?.authorship?.disclaimer).toMatch(/risk/i);

    const approved = await app.moderate.execute({
      actorUserId: moderator.user.id,
      articleId: created.id,
      decision: ModerationDecision.APPROVE,
      reason: 'Ensemble risk is explained and sources check out.',
    });
    expect(approved.status).toBe(ArticleStatus.READY_FOR_PUBLICATION);
    expect(await app.queue.execute({ actorUserId: moderator.user.id })).toHaveLength(0);
  });

  it('returns a flagged article to draft on revision and rejects publication', async () => {
    const app = createModerationApp(analyzerWithRisk(91, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const moderator = await verifiedUser(app, 'mod@example.com', 'lead-moderator');
    await promoteModerator(app, moderator.user.id);
    const category = await app.seedCategory();
    const first = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Needs Revision',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: first.id });
    const firstArticle = await app.articles.findById(asArticleId(first.id));
    await app.process.execute({
      analysisJobId: (await app.jobs.findActiveByArticleVersionId(firstArticle!.currentVersionId))!.id,
    });
    const revised = await app.moderate.execute({
      actorUserId: moderator.user.id,
      articleId: first.id,
      decision: ModerationDecision.REQUEST_REVISION,
      reason: 'Please add methods detail before publication.',
    });
    expect(revised.status).toBe(ArticleStatus.DRAFT);

    const second = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Rejected Note',
      abstract: 'Abstract',
      content: `${BODY} Unique enough.`,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: second.id });
    const secondArticle = await app.articles.findById(asArticleId(second.id));
    await app.process.execute({
      analysisJobId: (await app.jobs.findActiveByArticleVersionId(secondArticle!.currentVersionId))!.id,
    });
    const rejected = await app.moderate.execute({
      actorUserId: moderator.user.id,
      articleId: second.id,
      decision: ModerationDecision.REJECT,
      reason: 'Unsafe overlap with another submission.',
    });
    expect(rejected.status).toBe(ArticleStatus.REJECTED);
  });

  it('lets a moderator pull a published article into review', async () => {
    const app = createModerationApp(analyzerWithRisk(20, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const moderator = await verifiedUser(app, 'mod@example.com', 'lead-moderator');
    await promoteModerator(app, moderator.user.id);
    const category = await app.seedCategory();
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Published Then Flagged',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    const article = await app.articles.findById(asArticleId(created.id));
    await app.process.execute({
      analysisJobId: (await app.jobs.findActiveByArticleVersionId(article!.currentVersionId))!.id,
    });
    await app.publish.execute({ actorUserId: author.user.id, articleId: created.id });

    const flagged = await app.flag.execute({
      actorUserId: moderator.user.id,
      articleId: created.id,
      reason: 'Reader report about citation stuffing.',
    });
    expect(flagged.status).toBe(ArticleStatus.REQUIRES_REVIEW);

    const restored = await app.moderate.execute({
      actorUserId: moderator.user.id,
      articleId: created.id,
      decision: ModerationDecision.APPROVE,
      reason: 'Citations were checked and the snapshot still stands.',
    });
    expect(restored.status).toBe(ArticleStatus.PUBLISHED);
  });

  it('rate-limits moderator decisions', async () => {
    const app = createModerationApp(analyzerWithRisk(91, 80));
    const author = await verifiedUser(app, 'ada@example.com', 'ada-author');
    const moderator = await verifiedUser(app, 'mod@example.com', 'lead-moderator');
    await promoteModerator(app, moderator.user.id);
    const category = await app.seedCategory();
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Rate Limited Review',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    const article = await app.articles.findById(asArticleId(created.id));
    await app.process.execute({
      analysisJobId: (await app.jobs.findActiveByArticleVersionId(article!.currentVersionId))!.id,
    });

    const policy = OPERATION_RATE_LIMITS.moderatePerUser;
    for (let i = 0; i < policy.limit; i += 1) {
      await app.rateLimiter.consume(rateLimitKey('moderate-user', moderator.user.id), policy.limit, policy.windowMs);
    }

    await expect(
      app.moderate.execute({
        actorUserId: moderator.user.id,
        articleId: created.id,
        decision: ModerationDecision.APPROVE,
        reason: 'This decision should be blocked by the operation rate limit.',
      }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });
});
