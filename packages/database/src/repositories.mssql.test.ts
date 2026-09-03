import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  AiUsageRecord,
  AnalysisEvidence,
  AnalysisJob,
  OperationalEvent,
  OperationalEventKind,
  AnalysisMetric,
  AnalysisRun,
  Article,
  ArticleStatus,
  AuditAction,
  AuditLog,
  AuthToken,
  AuthTokenPurpose,
  Category,
  CitationVerificationStatus,
  EmailAddress,
  LoginAttempt,
  ModerationDecision,
  ModerationReview,
  Profile,
  parseSearchTokens,
  Role,
  Score,
  ScoreSnapshot,
  ScoringPolicy,
  Session,
  Slug,
  SourceReference,
  SourceType,
  Tag,
  User,
  AnalysisEvidenceType,
  MetricType,
  asAiUsageRecordId,
  asAnalysisEvidenceId,
  asOperationalEventId,
  asAnalysisJobId,
  asAnalysisMetricId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asAuditLogId,
  asAuthTokenId,
  asCategoryId,
  asLoginAttemptId,
  asModerationReviewId,
  asProfileId,
  asScoreSnapshotId,
  asSessionId,
  asSourceReferenceId,
  asTagId,
  asUserId,
} from '@aip/domain';
import {
  PrismaAiUsageRecordRepository,
  PrismaAnalysisEvidenceRepository,
  PrismaObservabilityRepository,
  PrismaOperationalEventRepository,
  PrismaAnalysisJobRepository,
  PrismaAnalysisMetricRepository,
  PrismaAnalysisRunRepository,
  PrismaArticleRepository,
  PrismaArticleTaxonomyRepository,
  PrismaArticleVersionRepository,
  PrismaAuthTokenRepository,
  PrismaCategoryRepository,
  PrismaLoginAttemptRepository,
  PrismaModerationReviewRepository,
  PrismaAuditLogRepository,
  PrismaProfileRepository,
  PrismaScoreSnapshotRepository,
  PrismaScoringPolicyRepository,
  PrismaSessionRepository,
  PrismaPublicArticleDiscoveryRepository,
  PrismaSourceReferenceRepository,
  PrismaTagRepository,
  PrismaUserRepository,
} from './repositories';
import { probeFullTextSearch } from './full-text-search-probe';
import {
  connectOrExplain,
  createTestPrisma,
  hashContent,
  isUniqueViolation,
  newId,
  resetDatabase,
} from './test-support';

const NOW = new Date('2026-08-29T10:00:00.000Z');
const LATER = new Date('2026-08-29T11:00:00.000Z');

describe('Prisma repositories against MSSQL', () => {
  const prisma = createTestPrisma();
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const categories = new PrismaCategoryRepository(prisma);
  const tags = new PrismaTagRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const versions = new PrismaArticleVersionRepository(prisma);
  const taxonomy = new PrismaArticleTaxonomyRepository(prisma);
  const jobs = new PrismaAnalysisJobRepository(prisma);
  const runs = new PrismaAnalysisRunRepository(prisma);
  const metrics = new PrismaAnalysisMetricRepository(prisma);
  const evidence = new PrismaAnalysisEvidenceRepository(prisma);
  const sourceReferences = new PrismaSourceReferenceRepository(prisma);
  const snapshots = new PrismaScoreSnapshotRepository(prisma);
  const policies = new PrismaScoringPolicyRepository(prisma);
  const sessions = new PrismaSessionRepository(prisma);
  const authTokens = new PrismaAuthTokenRepository(prisma);
  const loginAttempts = new PrismaLoginAttemptRepository(prisma);
  const moderationReviews = new PrismaModerationReviewRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);
  const usageRecords = new PrismaAiUsageRecordRepository(prisma);
  const operationalEvents = new PrismaOperationalEventRepository(prisma);
  const observability = new PrismaObservabilityRepository(prisma);

  beforeAll(async () => {
    await connectOrExplain(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('round-trips users, profiles, categories, and tags', async () => {
    const user = User.register({
      id: asUserId(newId()),
      email: EmailAddress.from('Author@Example.com'),
      passwordHash: 'hashed',
      now: NOW,
    });
    await users.save(user);

    const loadedUser = await users.findByEmail(EmailAddress.from('author@example.com'));
    expect(loadedUser?.id).toBe(user.id);
    expect(loadedUser?.email.value).toBe('author@example.com');

    const profile = Profile.create({
      id: asProfileId(newId()),
      userId: user.id,
      displayName: 'Ada Author',
      username: Slug.from('ada-author'),
      websiteUrl: 'https://example.com',
      now: NOW,
    });
    await profiles.save(profile);
    expect((await profiles.findByUsername(Slug.from('ada-author')))?.displayName).toBe('Ada Author');
    expect((await profiles.findByUserId(user.id))?.id).toBe(profile.id);

    const category = Category.create({
      id: asCategoryId(newId()),
      name: 'Computer Science',
      slug: Slug.from('computer-science'),
      now: NOW,
    });
    await categories.save(category);
    expect((await categories.findBySlug(Slug.from('computer-science')))?.name).toBe('Computer Science');

    const tag = Tag.create({
      id: asTagId(newId()),
      name: 'Methods',
      slug: Slug.from('methods'),
      now: NOW,
    });
    await tags.save(tag);
    expect((await tags.findById(tag.id))?.name).toBe('Methods');
  });

  it('persists article versions separately from articles and invalidates publication on content change', async () => {
    const author = await persistAuthor();
    const content = 'Original methods and results.';
    const draft = Article.draft({
      id: asArticleId(newId()),
      authorId: author.id,
      versionId: asArticleVersionId(newId()),
      title: 'Versioned Evaluation',
      abstract: 'Abstract',
      content,
      contentHash: hashContent(content),
      language: 'en',
      slug: Slug.from('versioned-evaluation'),
      now: NOW,
    });

    const published = draft.article
      .submit(draft.version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.completeAnalysis(NOW)
      .article.markReadyForPublication(NOW)
      .article.publish(NOW).article;

    await articles.save(published);
    await versions.save(draft.version);

    const loaded = await articles.findBySlug(Slug.from('versioned-evaluation'));
    expect(loaded?.status).toBe(ArticleStatus.PUBLISHED);
    expect(loaded?.currentVersionId).toBe(draft.version.id);

    const revisedContent = 'Revised methods after publication.';
    const revision = published.revise({
      versionId: asArticleVersionId(newId()),
      title: 'Versioned Evaluation',
      abstract: 'Abstract',
      content: revisedContent,
      contentHash: hashContent(revisedContent),
      now: LATER,
    });

    await articles.save(revision.article);
    await versions.save(revision.version);

    const afterEdit = await articles.findById(published.id);
    expect(afterEdit?.status).toBe(ArticleStatus.DRAFT);
    expect(afterEdit?.publishedAt).toBeNull();
    expect(afterEdit?.currentVersionNumber).toBe(2);
    expect(afterEdit?.currentVersionId).toBe(revision.version.id);

    const history = await versions.listByArticleId(published.id);
    expect(history.map((version) => version.versionNumber)).toEqual([1, 2]);
  });

  it('lists author articles and replaces category/tag assignments', async () => {
    const author = await persistAuthor();
    const other = await persistAuthor();
    const category = Category.create({
      id: asCategoryId(newId()),
      name: 'Biology',
      slug: Slug.from('biology'),
      now: NOW,
    });
    const inactive = Category.create({
      id: asCategoryId(newId()),
      name: 'Hidden',
      slug: Slug.from('hidden'),
      now: NOW,
    }).deactivate(LATER);
    await categories.save(category);
    await categories.save(inactive);

    const tag = Tag.create({
      id: asTagId(newId()),
      name: 'Methods',
      slug: Slug.from('methods'),
      now: NOW,
    });
    await tags.save(tag);

    const owned = await persistDraft(author.id, 'author-owned-draft');
    await persistDraft(other.id, 'other-author-draft');
    await taxonomy.replaceCategories(owned.article.id, [category.id]);
    await taxonomy.replaceTags(owned.article.id, [tag.id]);

    const listed = await articles.listByAuthorId(author.id);
    expect(listed.map((article) => article.id)).toEqual([owned.article.id]);
    expect(await taxonomy.listCategoryIds(owned.article.id)).toEqual([category.id]);
    expect(await taxonomy.listTagIds(owned.article.id)).toEqual([tag.id]);
    expect((await categories.listActive()).map((item) => item.name)).toEqual(['Biology']);
    expect((await versions.findManyByIds([owned.version.id])).map((version) => version.id)).toEqual([
      owned.version.id,
    ]);
  });

  it('persists content-analysis metrics bound to an analysis run', async () => {
    const author = await persistAuthor();
    const { article, version } = await persistDraft(author.id, 'content-analysis-metrics');
    const run = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      pipelineVersion: 'analysis-pipeline-content-1',
      promptVersion: 'prompt-bundle-content-1',
      modelProvider: 'fake',
      modelName: 'deterministic',
      now: NOW,
    }).complete({ tokenUsage: 30, estimatedCost: 0, now: NOW });

    await runs.save(run);
    await metrics.saveMany([
      AnalysisMetric.record({
        id: asAnalysisMetricId(newId()),
        analysisRunId: run.id,
        metricType: MetricType.STRUCTURE,
        score: Score.from(74),
        confidence: Score.from(70),
        explanation: 'Meets the technical structure policy.',
        createdAt: NOW,
      }),
    ]);
    await evidence.saveMany([
      AnalysisEvidence.record({
        id: asAnalysisEvidenceId(newId()),
        analysisRunId: run.id,
        metricType: MetricType.STRUCTURE,
        evidenceType: AnalysisEvidenceType.ARTICLE_TYPE,
        claim: 'technical',
        evidence: 'Methods language without a full empirical design.',
        sourceUrl: null,
        sourceTitle: null,
        reliability: null,
        createdAt: NOW,
      }),
    ]);

    const storedMetrics = await metrics.listByAnalysisRunId(run.id);
    const storedEvidence = await evidence.listByAnalysisRunId(run.id);

    expect(storedMetrics).toHaveLength(1);
    expect(storedMetrics[0]?.score.value).toBe(74);
    expect(storedMetrics[0]?.isBoundTo(run.id)).toBe(true);
    expect(storedEvidence[0]?.claim).toBe('technical');
    expect(storedEvidence[0]?.sourceUrl).toBeNull();
  });

  it('persists collected source references bound to an analysis run', async () => {
    const author = await persistAuthor();
    const { article, version } = await persistDraft(author.id, 'research-source-references');
    const run = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      pipelineVersion: 'analysis-pipeline-research-1',
      promptVersion: 'prompt-bundle-research-1',
      modelProvider: 'fake',
      modelName: 'deterministic',
      now: NOW,
    }).complete({ tokenUsage: 40, estimatedCost: 0, now: NOW });

    await runs.save(run);
    await sourceReferences.saveMany([
      SourceReference.record({
        id: asSourceReferenceId(newId()),
        articleId: article.id,
        analysisRunId: run.id,
        url: 'https://example.org/paper',
        title: 'Collected paper',
        publisher: null,
        doi: null,
        sourceType: SourceType.WEB,
        verificationStatus: CitationVerificationStatus.PARTIALLY_VERIFIED,
        reliabilityScore: Score.from(70),
        createdAt: NOW,
      }),
    ]);

    const stored = await sourceReferences.listByAnalysisRunId(run.id);
    expect(stored).toHaveLength(1);
    expect(stored[0]?.url).toBe('https://example.org/paper');
    expect(stored[0]?.isBoundTo(run.id)).toBe(true);
    expect(stored[0]?.verificationStatus).toBe(CitationVerificationStatus.PARTIALLY_VERIFIED);
  });

  it('binds score snapshots to an article version and returns the latest snapshot', async () => {
    const author = await persistAuthor();
    const { article, version } = await persistDraft(author.id, 'score-source-of-truth');

    const firstRun = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      pipelineVersion: 'p1',
      promptVersion: 'pr1',
      modelProvider: 'fake',
      modelName: 'fake',
      now: NOW,
    }).complete({ tokenUsage: 10, estimatedCost: 0.01, now: NOW });
    const secondRun = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      pipelineVersion: 'p1',
      promptVersion: 'pr1',
      modelProvider: 'fake',
      modelName: 'fake',
      now: LATER,
    }).complete({ tokenUsage: 20, estimatedCost: 0.02, now: LATER });

    await runs.save(firstRun);
    await runs.save(secondRun);

    const policy = ScoringPolicy.initial();
    const firstScore = policy.evaluate({
      metrics: uniformMetrics(70),
      authorshipRisk: Score.from(20),
      authorshipConfidence: Score.from(80),
    });
    const secondScore = policy.evaluate({
      metrics: uniformMetrics(90),
      authorshipRisk: Score.from(10),
      authorshipConfidence: Score.from(90),
    });

    await snapshots.save(
      ScoreSnapshot.capture({
        id: asScoreSnapshotId(newId()),
        articleId: article.id,
        articleVersionId: version.id,
        analysisRunId: firstRun.id,
        qualityScore: firstScore.qualityScore,
        authorshipRisk: firstScore.authorshipRisk,
        authorshipConfidence: firstScore.authorshipConfidence,
        authorshipIntegrity: firstScore.authorshipIntegrity,
        authorshipClassification: firstScore.authorshipClassification,
        overallScore: firstScore.overallScore,
        scoringPolicyVersion: firstScore.scoringPolicyVersion,
        createdAt: NOW,
      }),
    );
    await snapshots.save(
      ScoreSnapshot.capture({
        id: asScoreSnapshotId(newId()),
        articleId: article.id,
        articleVersionId: version.id,
        analysisRunId: secondRun.id,
        qualityScore: secondScore.qualityScore,
        authorshipRisk: secondScore.authorshipRisk,
        authorshipConfidence: secondScore.authorshipConfidence,
        authorshipIntegrity: secondScore.authorshipIntegrity,
        authorshipClassification: secondScore.authorshipClassification,
        overallScore: secondScore.overallScore,
        scoringPolicyVersion: secondScore.scoringPolicyVersion,
        createdAt: LATER,
      }),
    );

    const latest = await snapshots.findLatestByArticleVersionId(version.id);
    expect(latest?.analysisRunId).toBe(secondRun.id);
    expect(latest?.overallScore.value).toBe(secondScore.overallScore.value);
    expect(latest?.isBoundTo(version.id)).toBe(true);
    expect((await snapshots.findByAnalysisRunId(firstRun.id))?.overallScore.value).toBe(
      firstScore.overallScore.value,
    );

    const articleRow = await prisma.article.findUnique({ where: { id: article.id } });
    expect(articleRow).not.toHaveProperty('qualityScore');
    expect(articleRow).not.toHaveProperty('finalScore');
    expect(articleRow).not.toHaveProperty('overallScore');
  });

  it('stores scoring policy v1 as the active policy', async () => {
    await policies.save(ScoringPolicy.initial());
    const active = await policies.findActive();
    expect(active?.version).toBe('v1');
    expect(active?.qualityWeights.citationQuality).toBe(0.1);
    expect(active?.qualityWeights.evidence).toBe(0.1);
    expect(await policies.findByVersion('v1')).not.toBeNull();
  });

  it('finds the active analysis job for a version', async () => {
    const author = await persistAuthor();
    const { article, version } = await persistDraft(author.id, 'queued-analysis');
    const job = AnalysisJob.enqueue({
      id: asAnalysisJobId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      now: NOW,
    });
    await jobs.save(job);

    const active = await jobs.findActiveByArticleVersionId(version.id);
    expect(active?.id).toBe(job.id);

    await jobs.save(job.start(NOW).complete(LATER));
    expect(await jobs.findActiveByArticleVersionId(version.id)).toBeNull();
  });

  it('claims a queued job once and lists due queued jobs', async () => {
    const author = await persistAuthor();
    const { article, version } = await persistDraft(author.id, 'due-analysis');
    const job = AnalysisJob.enqueue({
      id: asAnalysisJobId(newId()),
      articleId: article.id,
      articleVersionId: version.id,
      now: NOW,
    });
    await jobs.save(job);

    const due = await jobs.findDueQueued(NOW, 10);
    expect(due.map((item) => item.id)).toContain(job.id);

    const started = job.start(NOW);
    expect(await jobs.saveIfStatus(started, job.status)).toBe(true);
    expect(await jobs.saveIfStatus(started.complete(LATER), job.status)).toBe(false);
    expect(await jobs.saveIfStatus(started.complete(LATER), started.status)).toBe(true);
    expect(await jobs.findDueQueued(NOW, 10)).toHaveLength(0);
  });

  it('enforces unique email, username, slugs, and version numbers', async () => {
    const user = User.register({
      id: asUserId(newId()),
      email: EmailAddress.from('unique@example.com'),
      passwordHash: 'hashed',
      now: NOW,
    });
    await users.save(user);

    await expect(
      users.save(
        User.register({
          id: asUserId(newId()),
          email: EmailAddress.from('unique@example.com'),
          passwordHash: 'hashed',
          now: NOW,
        }),
      ),
    ).rejects.toSatisfy(isUniqueViolation);

    await profiles.save(
      Profile.create({
        id: asProfileId(newId()),
        userId: user.id,
        displayName: 'Unique',
        username: Slug.from('unique-user'),
        now: NOW,
      }),
    );

    const other = User.register({
      id: asUserId(newId()),
      email: EmailAddress.from('other@example.com'),
      passwordHash: 'hashed',
      now: NOW,
    });
    await users.save(other);
    await expect(
      profiles.save(
        Profile.create({
          id: asProfileId(newId()),
          userId: other.id,
          displayName: 'Other',
          username: Slug.from('unique-user'),
          now: NOW,
        }),
      ),
    ).rejects.toSatisfy(isUniqueViolation);

    const first = await persistDraft(user.id, 'unique-article');
    await expect(persistDraft(user.id, 'unique-article')).rejects.toSatisfy(isUniqueViolation);

    await expect(
      prisma.articleVersion.create({
        data: {
          id: newId(),
          articleId: first.article.id,
          versionNumber: 1,
          title: 'Dup',
          abstract: '',
          content: 'x',
          contentHash: hashContent('x').value,
          createdAt: NOW,
        },
      }),
    ).rejects.toSatisfy(isUniqueViolation);
  });

  it('creates expected unique constraints and query indexes', async () => {
    const indexes = await prisma.$queryRaw<Array<{ tableName: string; indexName: string }>>`
      SELECT t.name AS tableName, i.name AS indexName
      FROM sys.indexes AS i
      INNER JOIN sys.tables AS t ON t.object_id = i.object_id
      WHERE i.name IS NOT NULL
      ORDER BY t.name, i.name
    `;
    const names = indexes.map((row) => `${row.tableName}.${row.indexName}`);

    expect(names).toEqual(expect.arrayContaining([
      'User.User_email_key',
      'Profile.Profile_username_key',
      'Article.Article_slug_key',
      'Category.Category_slug_key',
      'Tag.Tag_slug_key',
      'Article.Article_status_idx',
      'Article.Article_authorId_idx',
      'Article.Article_publishedAt_idx',
      'Article.Article_status_publishedAt_idx',
      'Article.Article_status_language_publishedAt_idx',
      'Article.Article_authorId_updatedAt_idx',
      'Article.Article_status_updatedAt_idx',
      'Category.Category_isActive_name_idx',
      'AnalysisJob.AnalysisJob_status_idx',
      'AnalysisJob.AnalysisJob_articleId_idx',
      'AnalysisJob.AnalysisJob_status_queuedAt_idx',
      'ScoreSnapshot.ScoreSnapshot_articleVersionId_createdAt_idx',
      'ArticleVersion.ArticleVersion_articleId_versionNumber_key',
      'AnalysisJob.UX_AnalysisJob_ActiveArticleVersion',
      'ScoringPolicy.UX_ScoringPolicy_OneActive',
    ]));
  });

  it('evaluates SQL Server Full-Text Search availability without requiring it', async () => {
    const probe = await probeFullTextSearch(prisma);
    expect(typeof probe.installed).toBe('boolean');
    expect(probe.catalogCount).toBeGreaterThanOrEqual(0);
  });

  it('round-trips sessions, auth tokens, and login attempts', async () => {
    const user = await persistAuthor();
    const tokenHash = 'b'.repeat(64);
    const session = Session.issue({
      id: asSessionId(newId()),
      userId: user.id,
      tokenHash,
      now: NOW,
      ttlSeconds: 3600,
    });
    await sessions.save(session);

    const loadedSession = await sessions.findByTokenHash(tokenHash);
    expect(loadedSession?.isActive(NOW)).toBe(true);

    await sessions.revokeAllForUser(user.id, LATER);
    expect((await sessions.findByTokenHash(tokenHash))?.isActive(LATER)).toBe(false);

    const token = AuthToken.issue({
      id: asAuthTokenId(newId()),
      userId: user.id,
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
      tokenHash: 'c'.repeat(64),
      now: NOW,
      ttlSeconds: 3600,
    });
    await authTokens.save(token);
    await authTokens.consumeUnconsumed(user.id, AuthTokenPurpose.EMAIL_VERIFICATION, LATER);
    expect((await authTokens.findByTokenHash('c'.repeat(64)))?.consumedAt).toEqual(LATER);

    const attempt = LoginAttempt.record({
      id: asLoginAttemptId(newId()),
      email: user.email,
      succeeded: false,
      createdAt: NOW,
    });
    await loginAttempts.record(attempt);
    const recent = await loginAttempts.listRecentByEmail(user.email, NOW);
    expect(recent).toHaveLength(1);
    expect(recent[0]?.succeeded).toBe(false);
  });

  it('does not store calculated scores on the Article table', async () => {
    const columns = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = N'Article'
    `;
    const names = columns.map((row) => row.COLUMN_NAME);

    expect(names).toContain('currentVersionId');
    expect(names).not.toContain('qualityScore');
    expect(names).not.toContain('authorshipRiskScore');
    expect(names).not.toContain('finalScore');
    expect(names).not.toContain('title');
    expect(names).not.toContain('content');
  });

  it('discovers only published articles by persisted snapshot score', async () => {
    const author = await persistAuthor();
    await profiles.save(
      Profile.create({
        id: asProfileId(newId()),
        userId: author.id,
        displayName: 'Ada Author',
        username: Slug.from('ada-author'),
        now: NOW,
      }),
    );
    const science = Category.create({
      id: asCategoryId(newId()),
      name: 'Computer Science',
      slug: Slug.from('computer-science'),
      now: NOW,
    });
    await categories.save(science);
    const methods = Tag.create({
      id: asTagId(newId()),
      name: 'Methods',
      slug: Slug.from('methods'),
      now: NOW,
    });
    await tags.save(methods);

    const high = await persistPublishedDiscovery({
      authorId: author.id,
      slug: 'high-score-discovery',
      title: 'High Score Evaluation',
      abstract: 'Evaluation of versioned scores.',
      quality: 90,
      publishedAt: NOW,
    });
    const low = await persistPublishedDiscovery({
      authorId: author.id,
      slug: 'low-score-discovery',
      title: 'Low Score Methods',
      abstract: 'A methods note with a lower snapshot.',
      quality: 60,
      publishedAt: LATER,
    });
    await persistDraft(author.id, 'hidden-draft-evaluation');
    await taxonomy.replaceCategories(high.article.id, [science.id]);
    await taxonomy.replaceTags(high.article.id, [methods.id]);
    await taxonomy.replaceCategories(low.article.id, [science.id]);

    const discovery = new PrismaPublicArticleDiscoveryRepository(prisma);
    const ranked = await discovery.search({
      searchTokens: parseSearchTokens('evaluation'),
      categorySlug: 'computer-science',
      tagSlug: null,
      authorUsername: 'ada-author',
      language: 'en',
      minOverallScore: null,
      maxOverallScore: null,
      excludeArticleId: null,
      sort: 'overall_score',
      cursor: null,
      limit: 10,
    });

    expect(ranked.items.map((item) => item.article.slug.value)).toEqual(['high-score-discovery']);
    expect(ranked.items[0]?.snapshot.overallScore.value).toBeGreaterThan(70);
    expect(ranked.items[0]?.categories[0]?.slug.value).toBe('computer-science');
    expect(ranked.items[0]?.version.content).toBe('');
    expect(ranked.items[0]?.wordCount).toBeGreaterThan(0);

    const page = await discovery.search({
      searchTokens: [],
      categorySlug: null,
      tagSlug: null,
      authorUsername: null,
      language: null,
      minOverallScore: null,
      maxOverallScore: null,
      excludeArticleId: null,
      sort: 'overall_score',
      cursor: null,
      limit: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).not.toBeNull();
    const next = await discovery.search({
      searchTokens: [],
      categorySlug: null,
      tagSlug: null,
      authorUsername: null,
      language: null,
      minOverallScore: null,
      maxOverallScore: null,
      excludeArticleId: null,
      sort: 'overall_score',
      cursor: page.nextCursor,
      limit: 1,
    });
    expect(next.items[0]?.article.slug.value).not.toBe(page.items[0]?.article.slug.value);

    const missing = await discovery.findPublishedBySlug(Slug.from('hidden-draft-evaluation'));
    expect(missing).toBeNull();
    const found = await discovery.findPublishedBySlug(Slug.from('high-score-discovery'));
    expect(found?.version.title).toBe('High Score Evaluation');
    expect(found?.version.content.length).toBeGreaterThan(0);
    expect(found?.wordCount).toBeGreaterThan(0);
  });

  it('round-trips moderation reviews, audit logs, and review-queue listing', async () => {
    const author = await persistAuthor();
    const flagged = await persistDraft(author.id, 'flagged-for-review-queue');
    const reviewed = flagged.article
      .submit(flagged.version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.completeAnalysis(NOW)
      .article.requireReview(LATER).article;
    await articles.save(reviewed);

    const listed = await articles.listByStatus(ArticleStatus.REQUIRES_REVIEW);
    expect(listed.map((item) => item.id)).toContain(reviewed.id);
    const duplicates = await articles.listByCurrentContentHash(reviewed.currentContentHash);
    expect(duplicates.map((item) => item.id)).toContain(reviewed.id);

    const moderator = User.register({
      id: asUserId(newId()),
      email: EmailAddress.from(`${newId()}@example.com`),
      passwordHash: 'hashed',
      now: NOW,
    }).assignRole(Role.MODERATOR, Role.ADMIN, NOW);
    await users.save(moderator);

    const review = ModerationReview.record({
      id: asModerationReviewId(newId()),
      articleId: reviewed.id,
      articleVersionId: reviewed.currentVersionId,
      moderatorId: moderator.id,
      decision: ModerationDecision.APPROVE,
      reason: 'Snapshot and evidence are consistent.',
      notes: '',
      createdAt: LATER,
    });
    await moderationReviews.save(review);
    expect((await moderationReviews.listByArticleId(reviewed.id))[0]?.id).toBe(review.id);

    const audit = AuditLog.record({
      id: asAuditLogId(newId()),
      actorUserId: moderator.id,
      action: AuditAction.ARTICLE_MODERATED,
      entityType: 'Article',
      entityId: reviewed.id,
      metadata: JSON.stringify({ decision: ModerationDecision.APPROVE }),
      ipHash: 'a'.repeat(64),
      createdAt: LATER,
    });
    await auditLogs.save(audit);
    expect((await auditLogs.listByEntity('Article', reviewed.id))[0]?.action).toBe(
      AuditAction.ARTICLE_MODERATED,
    );
  });

  it('persists AI usage and assembles observability aggregates', async () => {
    const author = await persistAuthor();
    const draft = await persistDraft(author.id, `obs-${newId().slice(0, 8)}`);
    const queued = draft.article.submit(draft.version, NOW).article.queueForAnalysis(NOW).article;
    await articles.save(queued);
    const job = AnalysisJob.enqueue({
      id: asAnalysisJobId(newId()),
      articleId: queued.id,
      articleVersionId: queued.currentVersionId,
      now: NOW,
    })
      .start(NOW)
      .complete(LATER);
    await jobs.save(job);

    const run = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: queued.id,
      articleVersionId: queued.currentVersionId,
      pipelineVersion: 'p1',
      promptVersion: 'pr1',
      modelProvider: 'fake',
      modelName: 'fake',
      now: NOW,
    }).complete({ tokenUsage: 40, estimatedCost: 0.25, now: LATER });
    await runs.save(run);
    await usageRecords.saveMany([
      AiUsageRecord.record({
        id: asAiUsageRecordId(newId()),
        analysisRunId: run.id,
        provider: 'fake',
        model: 'deterministic',
        promptId: 'article-type-v1',
        promptVersion: 'v2',
        inputTokens: 20,
        outputTokens: 20,
        estimatedCost: 0.25,
        latencyMs: 30,
        recordedAt: LATER,
      }),
    ]);
    await operationalEvents.save(
      OperationalEvent.record({
        id: asOperationalEventId(newId()),
        kind: OperationalEventKind.AI_PROVIDER_FAILURE,
        status: 'failed',
        message: 'provider timeout',
        createdAt: LATER,
      }),
    );
    await observability.recordHeartbeat('worker', LATER);

    const snapshot = await observability.loadDashboard(LATER);
    const listed = await observability.listJobs({ limit: 10 });

    expect(snapshot.jobsCompleted).toBe(1);
    expect(snapshot.costToday).toBeGreaterThan(0);
    expect(snapshot.expensiveStages[0]?.promptId).toBe('article-type-v1');
    expect(snapshot.workerHeartbeatAt).toEqual(LATER);
    expect(listed[0]?.title).toBe('Draft Title');
    expect((await usageRecords.listByAnalysisRunId(run.id))[0]?.totalTokens).toBe(40);
  });

  async function persistAuthor(): Promise<User> {
    const user = User.register({
      id: asUserId(newId()),
      email: EmailAddress.from(`${newId()}@example.com`),
      passwordHash: 'hashed',
      now: NOW,
    });
    await users.save(user);
    return user;
  }

  async function persistDraft(authorId: ReturnType<typeof asUserId>, slug: string) {
    const content = `Body for ${slug}`;
    const draft = Article.draft({
      id: asArticleId(newId()),
      authorId,
      versionId: asArticleVersionId(newId()),
      title: 'Draft Title',
      abstract: 'Abstract',
      content,
      contentHash: hashContent(content),
      language: 'en',
      slug: Slug.from(slug),
      now: NOW,
    });
    await articles.save(draft.article);
    await versions.save(draft.version);
    return draft;
  }

  async function persistPublishedDiscovery(input: {
    authorId: User['id'];
    slug: string;
    title: string;
    abstract: string;
    quality: number;
    publishedAt: Date;
  }) {
    const content = `${input.abstract} Body for ${input.slug}.`;
    const draft = Article.draft({
      id: asArticleId(newId()),
      authorId: input.authorId,
      versionId: asArticleVersionId(newId()),
      title: input.title,
      abstract: input.abstract,
      content,
      contentHash: hashContent(content),
      language: 'en',
      slug: Slug.from(input.slug),
      now: input.publishedAt,
    });
    const published = draft.article
      .submit(draft.version, input.publishedAt)
      .article.queueForAnalysis(input.publishedAt)
      .article.startProcessing(input.publishedAt)
      .article.completeAnalysis(input.publishedAt)
      .article.markReadyForPublication(input.publishedAt)
      .article.publish(input.publishedAt).article;
    await articles.save(published);
    await versions.save(draft.version);

    const run = AnalysisRun.start({
      id: asAnalysisRunId(newId()),
      articleId: published.id,
      articleVersionId: published.currentVersionId,
      pipelineVersion: 'p1',
      promptVersion: 'pr1',
      modelProvider: 'fake',
      modelName: 'fake',
      now: input.publishedAt,
    }).complete({ tokenUsage: 10, estimatedCost: 0.01, now: input.publishedAt });
    await runs.save(run);

    const computed = ScoringPolicy.initial().evaluate({
      metrics: uniformMetrics(input.quality),
      authorshipRisk: Score.from(18),
      authorshipConfidence: Score.from(88),
    });
    await snapshots.save(
      ScoreSnapshot.fromComputed({
        id: asScoreSnapshotId(newId()),
        articleId: published.id,
        articleVersionId: published.currentVersionId,
        analysisRunId: run.id,
        computed,
        createdAt: input.publishedAt,
      }),
    );

    return { article: published, version: draft.version };
  }

  function uniformMetrics(value: number) {
    const score = Score.from(value);
    return {
      structure: score,
      contentQuality: score,
      topicRelevance: score,
      citationQuality: score,
      evidence: score,
      factualReliability: score,
      originality: score,
    };
  }
});
