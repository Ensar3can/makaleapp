import { createHash } from 'node:crypto';
import {
  AnalysisEvidence,
  AnalysisJob,
  AnalysisRun,
  Article,
  AuditAction,
  AuditLog,
  Category,
  ContentHash,
  EmailAddress,
  Profile,
  Role,
  Score,
  ScoreSnapshot,
  ScoringPolicy,
  Slug,
  Tag,
  User,
  AnalysisEvidenceType,
  MetricType,
  ModerationFlagCode,
  asAnalysisEvidenceId,
  asAnalysisJobId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asAuditLogId,
  asCategoryId,
  asProfileId,
  asScoreSnapshotId,
  asTagId,
  asUserId,
} from '@aip/domain';
import { ScryptPasswordHasher } from '@aip/auth';
import { getConfig } from '@aip/config';
import { createPrismaClient } from './prisma-client';
import {
  PrismaAnalysisJobRepository,
  PrismaAnalysisRunRepository,
  PrismaAnalysisEvidenceRepository,
  PrismaArticleRepository,
  PrismaArticleVersionRepository,
  PrismaAuditLogRepository,
  PrismaCategoryRepository,
  PrismaProfileRepository,
  PrismaScoreSnapshotRepository,
  PrismaScoringPolicyRepository,
  PrismaTagRepository,
  PrismaUserRepository,
} from './repositories';

const NOW = new Date('2026-08-29T12:00:00.000Z');

const IDS = {
  admin: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  moderator: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  author: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  adminProfile: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  moderatorProfile: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  authorProfile: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
  computerScience: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  biology: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
  economics: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  history: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
  philosophy: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc5',
  researchMethods: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  draftArticle: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  draftVersion: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  publishedArticle: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  publishedVersion: 'ffffffff-ffff-4fff-8fff-fffffffffff2',
  recentArticle: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  recentVersion: 'ffffffff-ffff-4fff-8fff-fffffffffff3',
  topArticle: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
  topVersion: 'ffffffff-ffff-4fff-8fff-fffffffffff4',
  analysisJob: '99999999-9999-4999-8999-999999999991',
  analysisRun: '99999999-9999-4999-8999-999999999992',
  scoreSnapshot: '99999999-9999-4999-8999-999999999993',
  recentJob: '99999999-9999-4999-8999-999999999994',
  recentRun: '99999999-9999-4999-8999-999999999995',
  recentSnapshot: '99999999-9999-4999-8999-999999999996',
  topJob: '99999999-9999-4999-8999-999999999997',
  topRun: '99999999-9999-4999-8999-999999999998',
  topSnapshot: '99999999-9999-4999-8999-999999999999',
  flaggedArticle: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
  flaggedVersion: 'ffffffff-ffff-4fff-8fff-fffffffffff5',
  flaggedJob: '88888888-8888-4888-8888-888888888881',
  flaggedRun: '88888888-8888-4888-8888-888888888882',
  flaggedSnapshot: '88888888-8888-4888-8888-888888888883',
  flaggedEvidence: '88888888-8888-4888-8888-888888888884',
  flaggedAudit: '88888888-8888-4888-8888-888888888885',
} as const;

function contentHash(content: string): ContentHash {
  return ContentHash.from(createHash('sha256').update(content, 'utf8').digest('hex'));
}

async function seed(): Promise<void> {
  const prisma = createPrismaClient(getConfig().DATABASE_URL);
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const categories = new PrismaCategoryRepository(prisma);
  const tags = new PrismaTagRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const versions = new PrismaArticleVersionRepository(prisma);
  const jobs = new PrismaAnalysisJobRepository(prisma);
  const runs = new PrismaAnalysisRunRepository(prisma);
  const evidence = new PrismaAnalysisEvidenceRepository(prisma);
  const snapshots = new PrismaScoreSnapshotRepository(prisma);
  const policies = new PrismaScoringPolicyRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);

  try {
    await policies.save(ScoringPolicy.initial());

    const hasher = new ScryptPasswordHasher();
    const admin = User.register({
      id: asUserId(IDS.admin),
      email: EmailAddress.from('admin@local.test'),
      passwordHash: await hasher.hash('AdminPass1234'),
      now: NOW,
    })
      .assignRole(Role.ADMIN, Role.ADMIN, NOW)
      .verifyEmail(NOW);

    const moderator = User.register({
      id: asUserId(IDS.moderator),
      email: EmailAddress.from('moderator@local.test'),
      passwordHash: await hasher.hash('ModeratorPass1234'),
      now: NOW,
    })
      .assignRole(Role.MODERATOR, Role.ADMIN, NOW)
      .verifyEmail(NOW);

    const author = User.register({
      id: asUserId(IDS.author),
      email: EmailAddress.from('author@local.test'),
      passwordHash: await hasher.hash('AuthorPass1234'),
      now: NOW,
    }).verifyEmail(NOW);

    await users.save(admin);
    await users.save(moderator);
    await users.save(author);

    await profiles.save(
      Profile.create({
        id: asProfileId(IDS.adminProfile),
        userId: admin.id,
        displayName: 'Platform Admin',
        username: Slug.from('admin'),
        now: NOW,
      }),
    );
    await profiles.save(
      Profile.create({
        id: asProfileId(IDS.moderatorProfile),
        userId: moderator.id,
        displayName: 'Lead Moderator',
        username: Slug.from('moderator'),
        now: NOW,
      }),
    );
    await profiles.save(
      Profile.create({
        id: asProfileId(IDS.authorProfile),
        userId: author.id,
        displayName: 'Ada Author',
        username: Slug.from('ada-author'),
        bio: 'Writes reproducible methods notes.',
        now: NOW,
      }),
    );

    for (const category of [
      { id: IDS.computerScience, name: 'Computer Science', slug: 'computer-science' },
      { id: IDS.biology, name: 'Biology', slug: 'biology' },
      { id: IDS.economics, name: 'Economics', slug: 'economics' },
      { id: IDS.history, name: 'History', slug: 'history' },
      { id: IDS.philosophy, name: 'Philosophy', slug: 'philosophy' },
    ]) {
      await categories.save(
        Category.create({
          id: asCategoryId(category.id),
          name: category.name,
          slug: Slug.from(category.slug),
          now: NOW,
        }),
      );
    }

    await tags.save(
      Tag.create({
        id: asTagId(IDS.researchMethods),
        name: 'Research Methods',
        slug: Slug.from('research-methods'),
        now: NOW,
      }),
    );

    const draftContent = 'This draft still needs citations and a methods section.';
    const draft = Article.draft({
      id: asArticleId(IDS.draftArticle),
      authorId: author.id,
      versionId: asArticleVersionId(IDS.draftVersion),
      title: 'Open Questions in Evaluation Design',
      abstract: 'A working draft about how evaluation criteria should be versioned.',
      content: draftContent,
      contentHash: contentHash(draftContent),
      language: 'en',
      slug: Slug.from('open-questions-in-evaluation-design'),
      now: NOW,
    });
    await articles.save(draft.article);
    await versions.save(draft.version);

    const publishedContent =
      'Evaluation criteria must bind to an article version so later edits cannot inherit a stale score.';
    const publishedDraft = Article.draft({
      id: asArticleId(IDS.publishedArticle),
      authorId: author.id,
      versionId: asArticleVersionId(IDS.publishedVersion),
      title: 'Why Scores Belong to Article Versions',
      abstract: 'Argues that publication scores are invalid after a content change.',
      content: publishedContent,
      contentHash: contentHash(publishedContent),
      language: 'en',
      slug: Slug.from('why-scores-belong-to-article-versions'),
      now: NOW,
    });

    const published = publishedDraft.article
      .submit(publishedDraft.version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.completeAnalysis(NOW)
      .article.markReadyForPublication(NOW)
      .article.publish(NOW).article;

    await articles.save(published);
    await versions.save(publishedDraft.version);

    const job = AnalysisJob.enqueue({
      id: asAnalysisJobId(IDS.analysisJob),
      articleId: published.id,
      articleVersionId: published.currentVersionId,
      now: NOW,
    })
      .start(NOW)
      .complete(NOW);
    await jobs.save(job);

    const run = AnalysisRun.start({
      id: asAnalysisRunId(IDS.analysisRun),
      articleId: published.id,
      articleVersionId: published.currentVersionId,
      pipelineVersion: 'seed-pipeline',
      promptVersion: 'seed-prompt',
      modelProvider: 'fake',
      modelName: 'fake-analyzer',
      now: NOW,
    }).complete({ tokenUsage: 1200, estimatedCost: 0.02, now: NOW });
    await runs.save(run);

    const policy = ScoringPolicy.initial();
    const computed = policy.evaluate({
      metrics: {
        structure: Score.from(82),
        contentQuality: Score.from(80),
        topicRelevance: Score.from(78),
        citationQuality: Score.from(74),
        evidence: Score.from(76),
        factualReliability: Score.from(81),
        originality: Score.from(79),
      },
      authorshipRisk: Score.from(18),
      authorshipConfidence: Score.from(88),
    });

    await snapshots.save(
      ScoreSnapshot.capture({
        id: asScoreSnapshotId(IDS.scoreSnapshot),
        articleId: published.id,
        articleVersionId: published.currentVersionId,
        analysisRunId: run.id,
        qualityScore: computed.qualityScore,
        authorshipRisk: computed.authorshipRisk,
        authorshipConfidence: computed.authorshipConfidence,
        authorshipIntegrity: computed.authorshipIntegrity,
        authorshipClassification: computed.authorshipClassification,
        overallScore: computed.overallScore,
        scoringPolicyVersion: computed.scoringPolicyVersion,
        createdAt: NOW,
      }),
    );

    const recentAt = new Date('2026-08-30T12:00:00.000Z');
    const topAt = new Date('2026-08-28T12:00:00.000Z');
    const recent = await persistPublishedArticle({
      articles,
      versions,
      jobs,
      runs,
      snapshots,
      authorId: author.id,
      articleId: IDS.recentArticle,
      versionId: IDS.recentVersion,
      jobId: IDS.recentJob,
      runId: IDS.recentRun,
      snapshotId: IDS.recentSnapshot,
      title: 'Field Notes on Biological Sampling',
      abstract: 'A recent methods note on sampling bias in field biology.',
      content: 'Sampling protocols must be versioned so later edits cannot inherit a stale reliability score.',
      slug: 'field-notes-on-biological-sampling',
      quality: 64,
      risk: 22,
      now: recentAt,
    });
    const topRated = await persistPublishedArticle({
      articles,
      versions,
      jobs,
      runs,
      snapshots,
      authorId: author.id,
      articleId: IDS.topArticle,
      versionId: IDS.topVersion,
      jobId: IDS.topJob,
      runId: IDS.topRun,
      snapshotId: IDS.topSnapshot,
      title: 'Price Signals and Editorial Quality',
      abstract: 'Argues that public ranking should use persisted evaluation scores.',
      content: 'Discovery lists published articles by the ScoreSnapshot overall score, never by a client-side mix.',
      slug: 'price-signals-and-editorial-quality',
      quality: 91,
      risk: 12,
      now: topAt,
    });

    const flaggedAt = new Date('2026-08-30T15:00:00.000Z');
    const flagged = await persistFlaggedArticle({
      articles,
      versions,
      jobs,
      runs,
      snapshots,
      evidence,
      auditLogs,
      authorId: author.id,
      articleId: IDS.flaggedArticle,
      versionId: IDS.flaggedVersion,
      jobId: IDS.flaggedJob,
      runId: IDS.flaggedRun,
      snapshotId: IDS.flaggedSnapshot,
      evidenceId: IDS.flaggedEvidence,
      auditId: IDS.flaggedAudit,
      now: flaggedAt,
    });

    await prisma.articleCategory.deleteMany({
      where: { articleId: { in: [draft.article.id, published.id, recent.id, topRated.id, flagged.id] } },
    });
    await prisma.articleCategory.createMany({
      data: [
        { articleId: draft.article.id, categoryId: IDS.computerScience },
        { articleId: published.id, categoryId: IDS.computerScience },
        { articleId: published.id, categoryId: IDS.philosophy },
        { articleId: recent.id, categoryId: IDS.biology },
        { articleId: topRated.id, categoryId: IDS.economics },
        { articleId: flagged.id, categoryId: IDS.computerScience },
      ],
    });
    await prisma.articleTag.deleteMany({
      where: { articleId: { in: [published.id, recent.id, topRated.id] } },
    });
    await prisma.articleTag.createMany({
      data: [
        { articleId: published.id, tagId: IDS.researchMethods },
        { articleId: recent.id, tagId: IDS.researchMethods },
        { articleId: topRated.id, tagId: IDS.researchMethods },
      ],
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function persistPublishedArticle(input: {
  articles: PrismaArticleRepository;
  versions: PrismaArticleVersionRepository;
  jobs: PrismaAnalysisJobRepository;
  runs: PrismaAnalysisRunRepository;
  snapshots: PrismaScoreSnapshotRepository;
  authorId: User['id'];
  articleId: string;
  versionId: string;
  jobId: string;
  runId: string;
  snapshotId: string;
  title: string;
  abstract: string;
  content: string;
  slug: string;
  quality: number;
  risk: number;
  now: Date;
}): Promise<Article> {
  const drafted = Article.draft({
    id: asArticleId(input.articleId),
    authorId: input.authorId,
    versionId: asArticleVersionId(input.versionId),
    title: input.title,
    abstract: input.abstract,
    content: input.content,
    contentHash: contentHash(input.content),
    language: 'en',
    slug: Slug.from(input.slug),
    now: input.now,
  });
  const published = drafted.article
    .submit(drafted.version, input.now)
    .article.queueForAnalysis(input.now)
    .article.startProcessing(input.now)
    .article.completeAnalysis(input.now)
    .article.markReadyForPublication(input.now)
    .article.publish(input.now).article;

  await input.articles.save(published);
  await input.versions.save(drafted.version);

  await input.jobs.save(
    AnalysisJob.enqueue({
      id: asAnalysisJobId(input.jobId),
      articleId: published.id,
      articleVersionId: published.currentVersionId,
      now: input.now,
    })
      .start(input.now)
      .complete(input.now),
  );

  const run = AnalysisRun.start({
    id: asAnalysisRunId(input.runId),
    articleId: published.id,
    articleVersionId: published.currentVersionId,
    pipelineVersion: 'seed-pipeline',
    promptVersion: 'seed-prompt',
    modelProvider: 'fake',
    modelName: 'fake-analyzer',
    now: input.now,
  }).complete({ tokenUsage: 900, estimatedCost: 0.015, now: input.now });
  await input.runs.save(run);

  const computed = ScoringPolicy.initial().evaluate({
    metrics: {
      structure: Score.from(input.quality),
      contentQuality: Score.from(input.quality),
      topicRelevance: Score.from(input.quality),
      citationQuality: Score.from(input.quality),
      evidence: Score.from(input.quality),
      factualReliability: Score.from(input.quality),
      originality: Score.from(input.quality),
    },
    authorshipRisk: Score.from(input.risk),
    authorshipConfidence: Score.from(88),
  });

  await input.snapshots.save(
    ScoreSnapshot.capture({
      id: asScoreSnapshotId(input.snapshotId),
      articleId: published.id,
      articleVersionId: published.currentVersionId,
      analysisRunId: run.id,
      qualityScore: computed.qualityScore,
      authorshipRisk: computed.authorshipRisk,
      authorshipConfidence: computed.authorshipConfidence,
      authorshipIntegrity: computed.authorshipIntegrity,
      authorshipClassification: computed.authorshipClassification,
      overallScore: computed.overallScore,
      scoringPolicyVersion: computed.scoringPolicyVersion,
      createdAt: input.now,
    }),
  );

  return published;
}

async function persistFlaggedArticle(input: {
  articles: PrismaArticleRepository;
  versions: PrismaArticleVersionRepository;
  jobs: PrismaAnalysisJobRepository;
  runs: PrismaAnalysisRunRepository;
  snapshots: PrismaScoreSnapshotRepository;
  evidence: PrismaAnalysisEvidenceRepository;
  auditLogs: PrismaAuditLogRepository;
  authorId: User['id'];
  articleId: string;
  versionId: string;
  jobId: string;
  runId: string;
  snapshotId: string;
  evidenceId: string;
  auditId: string;
  now: Date;
}): Promise<Article> {
  const content =
    'High-confidence authorship risk is a review signal. It is not a binary AI-written verdict.';
  const drafted = Article.draft({
    id: asArticleId(input.articleId),
    authorId: input.authorId,
    versionId: asArticleVersionId(input.versionId),
    title: 'Authorship Risk Review Sample',
    abstract: 'A seeded article waiting in the moderation queue after an automatic flag.',
    content,
    contentHash: contentHash(content),
    language: 'en',
    slug: Slug.from('authorship-risk-review-sample'),
    now: input.now,
  });
  const flagged = drafted.article
    .submit(drafted.version, input.now)
    .article.queueForAnalysis(input.now)
    .article.startProcessing(input.now)
    .article.completeAnalysis(input.now)
    .article.requireReview(input.now).article;

  await input.articles.save(flagged);
  await input.versions.save(drafted.version);

  await input.jobs.save(
    AnalysisJob.enqueue({
      id: asAnalysisJobId(input.jobId),
      articleId: flagged.id,
      articleVersionId: flagged.currentVersionId,
      now: input.now,
    })
      .start(input.now)
      .complete(input.now),
  );

  const run = AnalysisRun.start({
    id: asAnalysisRunId(input.runId),
    articleId: flagged.id,
    articleVersionId: flagged.currentVersionId,
    pipelineVersion: 'seed-pipeline',
    promptVersion: 'seed-prompt',
    modelProvider: 'fake',
    modelName: 'fake-analyzer',
    now: input.now,
  }).complete({ tokenUsage: 900, estimatedCost: 0.015, now: input.now });
  await input.runs.save(run);

  const computed = ScoringPolicy.initial().evaluate({
    metrics: {
      structure: Score.from(72),
      contentQuality: Score.from(70),
      topicRelevance: Score.from(74),
      citationQuality: Score.from(68),
      evidence: Score.from(66),
      factualReliability: Score.from(71),
      originality: Score.from(69),
    },
    authorshipRisk: Score.from(91),
    authorshipConfidence: Score.from(82),
  });

  await input.snapshots.save(
    ScoreSnapshot.capture({
      id: asScoreSnapshotId(input.snapshotId),
      articleId: flagged.id,
      articleVersionId: flagged.currentVersionId,
      analysisRunId: run.id,
      qualityScore: computed.qualityScore,
      authorshipRisk: computed.authorshipRisk,
      authorshipConfidence: computed.authorshipConfidence,
      authorshipIntegrity: computed.authorshipIntegrity,
      authorshipClassification: computed.authorshipClassification,
      overallScore: computed.overallScore,
      scoringPolicyVersion: computed.scoringPolicyVersion,
      createdAt: input.now,
    }),
  );

  await input.evidence.saveMany([
    AnalysisEvidence.record({
      id: asAnalysisEvidenceId(input.evidenceId),
      analysisRunId: run.id,
      metricType: MetricType.AI_AUTHORSHIP_RISK,
      evidenceType: AnalysisEvidenceType.MODERATION_FLAG,
      claim: ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK,
      evidence:
        'Ensemble authorship classification is high with sufficient confidence. This is a risk estimate, not a verdict.',
      sourceUrl: null,
      sourceTitle: null,
      reliability: null,
      createdAt: input.now,
    }),
  ]);

  await input.auditLogs.save(
    AuditLog.record({
      id: asAuditLogId(input.auditId),
      actorUserId: null,
      action: AuditAction.ARTICLE_FLAGGED,
      entityType: 'Article',
      entityId: flagged.id,
      metadata: JSON.stringify({
        articleVersionId: flagged.currentVersionId,
        flags: [{ code: ModerationFlagCode.HIGH_AI_AUTHORSHIP_RISK }],
      }),
      ipHash: null,
      createdAt: input.now,
    }),
  );

  return flagged;
}

seed().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
