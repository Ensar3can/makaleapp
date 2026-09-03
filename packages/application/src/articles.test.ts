import { describe, expect, it } from 'vitest';
import {
  AnalysisJobStatus,
  ArticleNotFoundError,
  ArticleStatus,
  Category,
  EmailNotVerifiedError,
  OPERATION_RATE_LIMITS,
  Slug,
  asArticleVersionId,
  asCategoryId,
} from '@aip/domain';
import { RateLimitedError } from './errors';
import { ArticleClassificationService } from './article-classification';
import { FakeAnalysisService } from './fake-analysis-service';
import {
  FixedClock,
  InMemoryAnalysisEvidenceRepository,
  InMemoryAnalysisJobRepository,
  InMemoryAnalysisMetricRepository,
  InMemoryAnalysisRunRepository,
  InMemoryScoreSnapshotRepository,
  InMemorySourceReferenceRepository,
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
  FakePasswordHasher,
  FakeTokenDigest,
} from './fakes';
import { NoOpJobDispatcher } from './noop-job-dispatcher';
import { RegisterUserUseCase } from './use-cases/register-user';
import { VerifyEmailUseCase } from './use-cases/verify-email';
import { CreateArticleDraftUseCase } from './use-cases/create-article-draft';
import { GetAuthorArticleUseCase } from './use-cases/get-author-article';
import { ListAuthorArticlesUseCase } from './use-cases/list-author-articles';
import { SubmitArticleUseCase } from './use-cases/submit-article';
import { UpdateArticleDraftUseCase } from './use-cases/update-article-draft';
import { hashArticlePayload } from './content-hashing';

const NOW = new Date('2026-08-30T10:00:00.000Z');
const APP = 'http://localhost:3000';
const PASSWORD = 'AuthorPass1234';
const BODY = 'This methods section explains how evaluation binds to a version.';

function createArticles() {
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

  return {
    users,
    articles,
    versions,
    categories,
    tags,
    jobs,
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
    update: new UpdateArticleDraftUseCase(users, articles, versions, jobs, classification, ids, clock),
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
    get: new GetAuthorArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      runs,
      metrics,
      evidence,
      sources,
      snapshots,
      classification,
    ),
    list: new ListAuthorArticlesUseCase(users, articles, versions, classification),
  };
}

async function registerAuthor(
  app: ReturnType<typeof createArticles>,
  email: string,
  username: string,
  verify = true,
) {
  const identity = await app.register.execute({
    email,
    password: PASSWORD,
    displayName: username,
    username,
    appOrigin: APP,
  });

  if (verify) {
    const token = app.emails.messages.at(-1)?.text.match(/token=([^\s]+)/)?.[1];
    if (!token) {
      throw new Error('expected verification token');
    }
    await app.verify.execute({ token });
  }

  return identity;
}

async function seedCategory(app: ReturnType<typeof createArticles>, name = 'Computer Science') {
  const category = Category.create({
    id: asCategoryId(app.ids.next()),
    name,
    slug: Slug.from(name.toLowerCase().replace(/\s+/g, '-')),
    now: NOW,
  });
  await app.categories.save(category);
  return category;
}

describe('Article drafts and submission', () => {
  it('creates a draft bound to version 1 with categories and tags', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);

    const article = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Open Questions in Evaluation Design',
      abstract: 'Working notes.',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
      tagNames: ['Research Methods'],
    });

    expect(article.status).toBe(ArticleStatus.DRAFT);
    expect(article.currentVersionNumber).toBe(1);
    expect(article.title).toBe('Open Questions in Evaluation Design');
    expect(article.slug).toBe('open-questions-in-evaluation-design');
    expect(article.categories[0]?.name).toBe('Computer Science');
    expect(article.tags[0]?.name).toBe('Research Methods');
    expect(article.analysisJobStatus).toBeNull();
    expect(article.contentAnalysis).toBeNull();
    expect(article.score).toBeNull();
  });

  it('does not create a new version when only taxonomy changes', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const science = await seedCategory(app);
    const history = await seedCategory(app, 'History');
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Draft Title',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [science.id],
    });

    const updated = await app.update.execute({
      actorUserId: author.user.id,
      articleId: created.id,
      title: 'Draft Title',
      abstract: 'Abstract',
      content: BODY,
      categoryIds: [history.id],
      tagNames: ['methods'],
    });

    expect(updated.currentVersionNumber).toBe(1);
    expect(updated.versions).toHaveLength(1);
    expect(updated.categories[0]?.name).toBe('History');
    expect(updated.tags[0]?.slug).toBe('methods');
  });

  it('creates a new version and returns a submitted article to draft', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Versioned Note',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    const submitted = await app.submit.execute({
      actorUserId: author.user.id,
      articleId: created.id,
    });
    expect(submitted.status).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(submitted.analysisJobStatus).toBe(AnalysisJobStatus.QUEUED);

    const revised = await app.update.execute({
      actorUserId: author.user.id,
      articleId: created.id,
      title: 'Versioned Note',
      abstract: 'Abstract',
      content: `${BODY} Updated citations.`,
      categoryIds: [category.id],
    });

    expect(revised.status).toBe(ArticleStatus.DRAFT);
    expect(revised.currentVersionNumber).toBe(2);
    expect(revised.versions).toHaveLength(2);
    expect(revised.analysisJobStatus).toBeNull();
    expect(await app.jobs.findActiveByArticleVersionId(asArticleVersionId(submitted.currentVersionId))).toBeNull();
  });

  it('submits through FakeAnalysisService without calculating scores', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Queued Analysis',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    const submitted = await app.submit.execute({
      actorUserId: author.user.id,
      articleId: created.id,
    });
    const again = await app.submit.execute({
      actorUserId: author.user.id,
      articleId: created.id,
    });

    expect(submitted.status).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(again.status).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(again).not.toHaveProperty('overallScore');
    expect(again).not.toHaveProperty('qualityScore');
  });

  it('requires a verified email before submit', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author', false);
    const category = await seedCategory(app);
    const created = await app.create.execute({
      actorUserId: author.user.id,
      title: 'Unverified Submit',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    await expect(
      app.submit.execute({ actorUserId: author.user.id, articleId: created.id }),
    ).rejects.toBeInstanceOf(EmailNotVerifiedError);
  });

  it('hides another author article behind not-found (IDOR)', async () => {
    const app = createArticles();
    const owner = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const stranger = await registerAuthor(app, 'bob@example.com', 'bob-author');
    const category = await seedCategory(app);
    const created = await app.create.execute({
      actorUserId: owner.user.id,
      title: 'Private Draft',
      abstract: 'Abstract',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    await expect(
      app.get.execute({ actorUserId: stranger.user.id, articleId: created.id }),
    ).rejects.toBeInstanceOf(ArticleNotFoundError);
    await expect(
      app.update.execute({
        actorUserId: stranger.user.id,
        articleId: created.id,
        title: 'Hijacked',
        abstract: 'Abstract',
        content: BODY,
        categoryIds: [category.id],
      }),
    ).rejects.toBeInstanceOf(ArticleNotFoundError);
    await expect(
      app.submit.execute({ actorUserId: stranger.user.id, articleId: created.id }),
    ).rejects.toBeInstanceOf(ArticleNotFoundError);

    const listed = await app.list.execute({ actorUserId: stranger.user.id });
    expect(listed).toHaveLength(0);
  });

  it('lists only the author articles', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);
    await app.create.execute({
      actorUserId: author.user.id,
      title: 'First',
      abstract: '',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    app.clock.advance(1000);
    await app.create.execute({
      actorUserId: author.user.id,
      title: 'Second',
      abstract: '',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });

    const listed = await app.list.execute({ actorUserId: author.user.id });
    expect(listed.map((article) => article.title)).toEqual(['Second', 'First']);
  });

  it('rate-limits analysis submissions per author', async () => {
    const app = createArticles();
    const author = await registerAuthor(app, 'ada@example.com', 'ada-author');
    const category = await seedCategory(app);

    for (let i = 0; i < OPERATION_RATE_LIMITS.submitArticlePerUser.limit; i += 1) {
      const created = await app.create.execute({
        actorUserId: author.user.id,
        title: `Draft ${i}`,
        abstract: '',
        content: BODY,
        language: 'en',
        categoryIds: [category.id],
      });
      await app.submit.execute({ actorUserId: author.user.id, articleId: created.id });
    }

    const blocked = await app.create.execute({
      actorUserId: author.user.id,
      title: 'One too many',
      abstract: '',
      content: BODY,
      language: 'en',
      categoryIds: [category.id],
    });
    await expect(app.submit.execute({ actorUserId: author.user.id, articleId: blocked.id })).rejects.toBeInstanceOf(
      RateLimitedError,
    );
  });

  it('hashes title, abstract, and content together', () => {
    const first = hashArticlePayload({ title: 'A', abstract: 'B', content: 'C' });
    const second = hashArticlePayload({ title: 'A', abstract: 'B', content: 'D' });
    expect(first.equals(second)).toBe(false);
  });
});
