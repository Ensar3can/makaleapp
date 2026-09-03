import { describe, expect, it } from 'vitest';
import {
  AnalysisNotCompletedError,
  ArticleAlreadyPublishedError,
  ArticleNotFoundError,
  ArticleStatus,
  Category,
  CategoryNotFoundError,
  ProfileNotFoundError,
  Score,
  ScoreSnapshot,
  ScoringPolicy,
  Slug,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asCategoryId,
  asScoreSnapshotId,
  OPERATION_RATE_LIMITS,
} from '@aip/domain';
import { RateLimitedError } from './errors';
import { rateLimitKey } from './ports';
import { ArticleClassificationService } from './article-classification';
import { FakeAnalysisService } from './fake-analysis-service';
import {
  FixedClock,
  InMemoryAnalysisEvidenceRepository,
  InMemoryAnalysisJobRepository,
  InMemoryAnalysisMetricRepository,
  InMemoryAnalysisRunRepository,
  InMemoryArticleRepository,
  InMemoryArticleTaxonomyRepository,
  InMemoryArticleVersionRepository,
  InMemoryAuthTokenRepository,
  InMemoryCategoryRepository,
  InMemoryProfileRepository,
  InMemoryPublicArticleDiscoveryRepository,
  InMemoryScoreSnapshotRepository,
  InMemorySourceReferenceRepository,
  InMemoryTagRepository,
  InMemoryUserRepository,
  MemoryCacheStore,
  MemoryEmailSender,
  MemoryRateLimiter,
  SequentialIdGenerator,
  SequentialTokenGenerator,
  FakePasswordHasher,
  FakeTokenDigest,
} from './fakes';
import { NoOpJobDispatcher } from './noop-job-dispatcher';
import { RegisterUserUseCase } from './use-cases/register-user';
import { VerifyEmailUseCase } from './use-cases/verify-email';
import { CreateArticleDraftUseCase } from './use-cases/create-article-draft';
import { SubmitArticleUseCase } from './use-cases/submit-article';
import { PublishArticleUseCase } from './use-cases/publish-article';
import { SearchArticlesUseCase } from './use-cases/search-articles';
import { GetPublicArticleUseCase } from './use-cases/get-public-article';
import { GetPublicAuthorProfileUseCase } from './use-cases/get-public-author-profile';
import { GetPublicCategoryUseCase } from './use-cases/get-public-category';
import { GetHomepageDiscoveryUseCase } from './use-cases/get-homepage-discovery';
import { ValidationError } from './errors';

const NOW = new Date('2026-08-30T10:00:00.000Z');
const APP = 'http://localhost:3000';
const PASSWORD = 'AuthorPass1234';
const BODY = 'This methods section explains how evaluation binds to a version.';

function createDiscoveryApp(cache?: MemoryCacheStore) {
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
  const hasher = new FakePasswordHasher();
  const tokens = new SequentialTokenGenerator();
  const digest = new FakeTokenDigest();
  const ids = new SequentialIdGenerator();
  const clock = new FixedClock(NOW);
  const emails = new MemoryEmailSender();
  const rateLimiter = new MemoryRateLimiter();
  const classification = new ArticleClassificationService(categories, tags, taxonomy, ids, clock);
  const analysis = new FakeAnalysisService(articles, jobs, ids, new NoOpJobDispatcher());
  const discovery = new InMemoryPublicArticleDiscoveryRepository(
    articles,
    versions,
    snapshots,
    profiles,
    categories,
    tags,
    taxonomy,
  );
  const search = new SearchArticlesUseCase(discovery, rateLimiter, cache);

  return {
    users,
    rateLimiter,
    articles,
    versions,
    categories,
    snapshots,
    emails,
    ids,
    clock,
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
    publish: new PublishArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      snapshots,
      classification,
      clock,
      cache,
    ),
    search,
    getPublic: new GetPublicArticleUseCase(discovery, runs, metrics, evidence, sources, search, cache),
    getCategory: new GetPublicCategoryUseCase(categories, search),
    getAuthor: new GetPublicAuthorProfileUseCase(profiles, search),
    homepage: new GetHomepageDiscoveryUseCase(search, categories, cache),
  };
}

async function registerAuthor(
  app: ReturnType<typeof createDiscoveryApp>,
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

async function seedCategory(app: ReturnType<typeof createDiscoveryApp>, name = 'Computer Science') {
  const category = Category.create({
    id: asCategoryId(app.ids.next()),
    name,
    slug: Slug.from(name.toLowerCase().replace(/\s+/g, '-')),
    now: NOW,
  });
  await app.categories.save(category);
  return category;
}

function snapshotFor(articleId: string, versionId: string, quality: number, risk = 18, confidence = 88) {
  const computed = ScoringPolicy.initial().evaluate({
    metrics: {
      structure: Score.from(quality),
      contentQuality: Score.from(quality),
      topicRelevance: Score.from(quality),
      citationQuality: Score.from(quality),
      evidence: Score.from(quality),
      factualReliability: Score.from(quality),
      originality: Score.from(quality),
    },
    authorshipRisk: Score.from(risk),
    authorshipConfidence: Score.from(confidence),
  });

  return ScoreSnapshot.fromComputed({
    id: asScoreSnapshotId(`${articleId}-snap`),
    articleId: asArticleId(articleId),
    articleVersionId: asArticleVersionId(versionId),
    analysisRunId: asAnalysisRunId(`${versionId}-run`),
    computed,
    createdAt: NOW,
  });
}

async function analyzeCurrent(
  app: ReturnType<typeof createDiscoveryApp>,
  articleId: string,
  quality: number,
) {
  const article = await app.articles.findById(asArticleId(articleId));
  if (!article) {
    throw new Error('article missing');
  }

  const completed = article.startProcessing(app.clock.now()).article.completeAnalysis(app.clock.now()).article;
  await app.articles.save(completed);
  await app.snapshots.save(snapshotFor(completed.id, completed.currentVersionId, quality));
  return completed;
}

async function publishArticle(
  app: ReturnType<typeof createDiscoveryApp>,
  actorUserId: string,
  title: string,
  categoryId: string,
  quality: number,
  tagNames: readonly string[] = [],
) {
  const draft = await app.create.execute({
    actorUserId,
    title,
    abstract: `${title} abstract about evaluation scores.`,
    content: BODY,
    language: 'en',
    categoryIds: [categoryId],
    tagNames: [...tagNames],
  });
  await app.submit.execute({ actorUserId, articleId: draft.id });
  await analyzeCurrent(app, draft.id, quality);
  return app.publish.execute({ actorUserId, articleId: draft.id });
}

describe('PublishArticleUseCase', () => {
  it('publishes an analyzed article with a ScoreSnapshot', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    const published = await publishArticle(app, author.user.id, 'Versioned Scores', category.id, 82);

    expect(published.status).toBe(ArticleStatus.PUBLISHED);
    expect(published.score?.overallScore).toBeGreaterThan(0);
    expect(published.score?.scoringPolicyVersion).toBe('v1');
  });

  it('refuses drafts and articles without a snapshot', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    const draft = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Still a draft',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    await expect(app.publish.execute({ actorUserId: author.user.id, articleId: draft.id })).rejects.toBeInstanceOf(
      AnalysisNotCompletedError,
    );

    await app.submit.execute({ actorUserId: author.user.id, articleId: draft.id });
    const queued = await app.articles.findById(asArticleId(draft.id));
    await app.articles.save(queued!.startProcessing(NOW).article.completeAnalysis(NOW).article);

    await expect(app.publish.execute({ actorUserId: author.user.id, articleId: draft.id })).rejects.toBeInstanceOf(
      AnalysisNotCompletedError,
    );
  });

  it('hides another author article and does not republish', async () => {
    const app = createDiscoveryApp();
    const owner = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const stranger = await registerAuthor(app, 'bob@example.com', 'bob-author');
    const category = await seedCategory(app);
    const published = await publishArticle(app, owner.user.id, 'Owned Note', category.id, 80);

    await expect(
      app.publish.execute({ actorUserId: stranger.user.id, articleId: published.id }),
    ).rejects.toBeInstanceOf(ArticleNotFoundError);
    await expect(
      app.publish.execute({ actorUserId: owner.user.id, articleId: published.id }),
    ).rejects.toBeInstanceOf(ArticleAlreadyPublishedError);
  });
});

describe('Public discovery', () => {
  it('lists only published articles and ranks by persisted snapshot score', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const science = await seedCategory(app);
    const history = await seedCategory(app, 'History');

    await publishArticle(app, author.user.id, 'Lower Score Methods', science.id, 60, ['methods']);
    app.clock.advance(60_000);
    await publishArticle(app, author.user.id, 'Higher Score Evaluation', history.id, 90);
    const draft = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Hidden Draft Evaluation',
      abstract: 'Should never appear in public search.',
      content: BODY,
      language: 'en',
      categoryIds: [science.id],
    });

    const ranked = await app.search.execute({ sort: 'overall_score', limit: 10 });
    expect(ranked.items.map((item) => item.title)).toEqual(['Higher Score Evaluation', 'Lower Score Methods']);
    expect(ranked.items[0]?.score.overallScore).toBeGreaterThan(ranked.items[1]?.score.overallScore ?? 0);
    expect(ranked.items.every((item) => item.slug !== draft.slug)).toBe(true);
    expect(ranked.items[0]).not.toHaveProperty('content');

    const recent = await app.search.execute({ sort: 'published_at', limit: 10 });
    expect(recent.items[0]?.title).toBe('Higher Score Evaluation');

    const filtered = await app.search.execute({
      query: 'evaluation',
      categorySlug: 'history',
      minOverallScore: 80,
    });
    expect(filtered.items.map((item) => item.title)).toEqual(['Higher Score Evaluation']);

    const homepage = await app.homepage.execute();
    expect(homepage.topRated[0]?.title).toBe('Higher Score Evaluation');
    expect(homepage.categories.map((category) => category.slug)).toEqual(['computer-science', 'history']);
  });

  it('paginates with a cursor and hides unpublished slugs', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    await publishArticle(app, author.user.id, 'First Published', category.id, 70);
    app.clock.advance(1_000);
    await publishArticle(app, author.user.id, 'Second Published', category.id, 85);

    const firstPage = await app.search.execute({ sort: 'overall_score', limit: 1 });
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await app.search.execute({
      sort: 'overall_score',
      limit: 1,
      cursor: firstPage.nextCursor ?? undefined,
    });
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.title).not.toBe(firstPage.items[0]?.title);

    await expect(app.getPublic.execute({ slug: 'hidden-draft-evaluation' })).rejects.toBeInstanceOf(
      ArticleNotFoundError,
    );
    await expect(app.getPublic.execute({ slug: 'Not A Slug' })).rejects.toBeInstanceOf(ArticleNotFoundError);
  });

  it('returns public detail from the snapshot and never invents a verdict', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    const published = await publishArticle(app, author.user.id, 'Public Detail Note', category.id, 81);
    const detail = await app.getPublic.execute({ slug: published.slug });

    expect(detail.id).toBe(published.id);
    expect(detail.score.overallScore).toBe(published.score?.overallScore);
    expect(detail.score.qualityScore).toBe(published.score?.qualityScore);
    expect(detail.authorship.classification).toBe(published.score?.authorshipClassification);
    expect(detail.authorship.disclaimer.length).toBeGreaterThan(0);
    expect(detail.authorship.disclaimer.toLowerCase()).not.toContain('ai-written');
    expect(JSON.stringify(detail).toLowerCase()).not.toContain('human-written');
    expect(detail.author.username).toBe('ada-author');
  });

  it('loads category and author public pages without exposing drafts', async () => {
    const app = createDiscoveryApp();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    await publishArticle(app, author.user.id, 'Biology Methods', category.id, 75);
    await app.create.execute({
      actorUserId: author.user.id,
      title: 'Unpublished Biology',
      abstract: 'Draft',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    const page = await app.getCategory.execute({ slug: 'computer-science' });
    expect(page.category.name).toBe('Computer Science');
    expect(page.articles.items.map((item) => item.title)).toEqual(['Biology Methods']);

    const profile = await app.getAuthor.execute({ username: 'ada-author' });
    expect(profile.displayName).toBe('ada-author');
    expect(profile.articles.items).toHaveLength(1);

    await expect(app.getCategory.execute({ slug: 'missing-topic' })).rejects.toBeInstanceOf(CategoryNotFoundError);
    await expect(app.getAuthor.execute({ username: 'nobody' })).rejects.toBeInstanceOf(ProfileNotFoundError);
    await expect(app.search.execute({ sort: 'popularity' })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rate-limits public search by client IP', async () => {
    const app = createDiscoveryApp();
    const policy = OPERATION_RATE_LIMITS.searchPerIp;

    for (let i = 0; i < policy.limit; i += 1) {
      await app.rateLimiter.consume(rateLimitKey('search-ip', '203.0.113.40'), policy.limit, policy.windowMs);
    }

    await expect(app.search.execute({ clientIp: '203.0.113.40' })).rejects.toBeInstanceOf(RateLimitedError);
    await expect(app.search.execute({})).resolves.toMatchObject({ items: [] });
  });

  it('caches public homepage results and invalidates them after publish', async () => {
    const cache = new MemoryCacheStore();
    const app = createDiscoveryApp(cache);
    const author = await registerAuthor(app, 'cache@example.com', 'cache-author');
    const category = await seedCategory(app);

    const empty = await app.homepage.execute();
    expect(empty.topRated).toHaveLength(0);

    await publishArticle(app, author.user.id, 'Cached Methods Paper', category.id, 80);
    const afterPublish = await app.homepage.execute();
    expect(afterPublish.topRated.map((item) => item.title)).toEqual(['Cached Methods Paper']);

    const cached = await app.homepage.execute();
    expect(cached.topRated).toHaveLength(1);
  });
});
