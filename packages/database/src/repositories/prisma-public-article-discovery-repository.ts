import {
  ArticleStatus,
  countWords,
  type PublicArticleDiscoveryRepository,
  type PublicDiscoveryPage,
  type PublicDiscoveryQuery,
  type PublicDiscoveryRecord,
  type PublicSitemapEntry,
  type Slug,
  createDiscoveryCursor,
} from '@aip/domain';
import { Prisma, type PrismaClient } from '../generated/client';
import {
  numberFromDecimal,
  toArticle,
  toArticleVersion,
  toCategory,
  toProfile,
  toScoreSnapshot,
  toTag,
} from '../mappers';
import type {
  Article as ArticleRow,
  ArticleVersion as ArticleVersionRow,
  Category as CategoryRow,
  Profile as ProfileRow,
  ScoreSnapshot as ScoreSnapshotRow,
  Tag as TagRow,
} from '../generated/client';

interface DiscoveryJoinRow {
  articleId: string;
  authorId: string;
  articleSlug: string;
  language: string;
  status: string;
  currentVersionId: string;
  currentVersionNumber: number;
  currentContentHash: string;
  publishedAt: Date | null;
  articleCreatedAt: Date;
  articleUpdatedAt: Date;
  versionId: string;
  versionArticleId: string;
  versionNumber: number;
  title: string;
  abstract: string;
  content: string;
  contentHash: string;
  versionCreatedAt: Date;
  snapshotId: string;
  snapshotArticleId: string;
  snapshotVersionId: string;
  analysisRunId: string;
  qualityScore: Prisma.Decimal | number;
  authorshipRisk: Prisma.Decimal | number;
  authorshipConfidence: Prisma.Decimal | number;
  authorshipIntegrity: Prisma.Decimal | number;
  authorshipClassification: string;
  overallScore: Prisma.Decimal | number;
  scoringPolicyVersion: string;
  snapshotCreatedAt: Date;
  profileId: string;
  profileUserId: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
  profileCreatedAt: Date;
  profileUpdatedAt: Date;
  wordCount: number | null;
}

const PUBLISHED = ArticleStatus.PUBLISHED;

export class PrismaPublicArticleDiscoveryRepository implements PublicArticleDiscoveryRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async search(query: PublicDiscoveryQuery): Promise<PublicDiscoveryPage> {
    const take = validatedTake(query.limit + 1);
    const rows = await this.prisma.$queryRaw<DiscoveryJoinRow[]>`
      SELECT TOP (${take})
        ${discoverySelect(false)}
      FROM [Article] a
      INNER JOIN [ArticleVersion] v ON v.id = a.currentVersionId
      INNER JOIN [Profile] p ON p.userId = a.authorId
      INNER JOIN [ScoreSnapshot] s ON s.id = (
        SELECT TOP 1 s2.id
        FROM [ScoreSnapshot] s2
        WHERE s2.articleVersionId = a.currentVersionId
        ORDER BY s2.createdAt DESC
      )
      WHERE ${buildWhere(query)}
      ORDER BY ${buildOrder(query.sort)}
    `;

    const pageRows = rows.slice(0, query.limit);
    const items = await this.toRecords(pageRows);
    const last = items.at(-1);
    const nextCursor =
      rows.length > query.limit && last?.article.publishedAt
        ? createDiscoveryCursor({
            sort: query.sort,
            overallScore: last.snapshot.overallScore,
            publishedAt: last.article.publishedAt,
            articleId: last.article.id,
          })
        : null;

    return { items, nextCursor };
  }

  public async findPublishedBySlug(slug: Slug): Promise<PublicDiscoveryRecord | null> {
    const rows = await this.prisma.$queryRaw<DiscoveryJoinRow[]>`
      SELECT TOP (${validatedTake(1)})
        ${discoverySelect(true)}
      FROM [Article] a
      INNER JOIN [ArticleVersion] v ON v.id = a.currentVersionId
      INNER JOIN [Profile] p ON p.userId = a.authorId
      INNER JOIN [ScoreSnapshot] s ON s.id = (
        SELECT TOP 1 s2.id
        FROM [ScoreSnapshot] s2
        WHERE s2.articleVersionId = a.currentVersionId
        ORDER BY s2.createdAt DESC
      )
      WHERE a.status = ${PUBLISHED}
        AND a.publishedAt IS NOT NULL
        AND a.slug = ${slug.value}
    `;

    const items = await this.toRecords(rows);
    return items[0] ?? null;
  }

  public async listPublishedIndex(limit: number): Promise<readonly PublicSitemapEntry[]> {
    const take = validatedTake(Math.min(5_000, Math.max(1, Math.trunc(limit))));
    const rows = await this.prisma.$queryRaw<Array<{ slug: string; publishedAt: Date; updatedAt: Date }>>`
      SELECT TOP (${take})
        a.slug,
        a.publishedAt,
        a.updatedAt
      FROM [Article] a
      INNER JOIN [ScoreSnapshot] s ON s.id = (
        SELECT TOP 1 s2.id
        FROM [ScoreSnapshot] s2
        WHERE s2.articleVersionId = a.currentVersionId
        ORDER BY s2.createdAt DESC
      )
      WHERE a.status = ${PUBLISHED}
        AND a.publishedAt IS NOT NULL
      ORDER BY a.publishedAt DESC, CONVERT(NVARCHAR(36), a.id) DESC
    `;

    return rows.map((row) => ({
      slug: row.slug,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
    }));
  }

  private async toRecords(rows: readonly DiscoveryJoinRow[]): Promise<PublicDiscoveryRecord[]> {
    if (rows.length === 0) {
      return [];
    }

    const articleIds = rows.map((row) => row.articleId);
    const [categoryLinks, tagLinks] = await Promise.all([
      this.prisma.articleCategory.findMany({
        where: { articleId: { in: articleIds } },
        include: { category: true },
      }),
      this.prisma.articleTag.findMany({
        where: { articleId: { in: articleIds } },
        include: { tag: true },
      }),
    ]);

    const categoriesByArticle = new Map<string, CategoryRow[]>();
    for (const link of categoryLinks) {
      const list = categoriesByArticle.get(link.articleId) ?? [];
      list.push(link.category);
      categoriesByArticle.set(link.articleId, list);
    }

    const tagsByArticle = new Map<string, TagRow[]>();
    for (const link of tagLinks) {
      const list = tagsByArticle.get(link.articleId) ?? [];
      list.push(link.tag);
      tagsByArticle.set(link.articleId, list);
    }

    return rows.map((row) => ({
      article: toArticle(toArticleRow(row)),
      version: toArticleVersion(toVersionRow(row)),
      snapshot: toScoreSnapshot(toSnapshotRow(row)),
      author: toProfile(toProfileRow(row)),
      categories: (categoriesByArticle.get(row.articleId) ?? []).map(toCategory),
      tags: (tagsByArticle.get(row.articleId) ?? []).map(toTag),
      wordCount: resolveWordCount(row),
    }));
  }
}

function validatedTake(count: number): Prisma.Sql {
  if (!Number.isInteger(count) || count < 1 || count > 5_000) {
    throw new Error('invalid discovery page size');
  }

  return Prisma.raw(String(count));
}

function discoverySelect(includeContent: boolean): Prisma.Sql {
  const contentColumn = includeContent
    ? Prisma.sql`v.content`
    : Prisma.sql`CAST(N'' AS NVARCHAR(MAX)) AS content`;
  const wordCountColumn = includeContent
    ? Prisma.sql`CAST(NULL AS INT) AS wordCount`
    : Prisma.sql`(
        SELECT COUNT(*)
        FROM STRING_SPLIT(
          REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(v.content)), CHAR(9), N' '), CHAR(13), N' '), CHAR(10), N' '),
          N' '
        )
        WHERE RTRIM([value]) <> N''
      ) AS wordCount`;

  return Prisma.sql`
    a.id AS articleId,
    a.authorId,
    a.slug AS articleSlug,
    a.language,
    a.status,
    a.currentVersionId,
    a.currentVersionNumber,
    a.currentContentHash,
    a.publishedAt,
    a.createdAt AS articleCreatedAt,
    a.updatedAt AS articleUpdatedAt,
    v.id AS versionId,
    v.articleId AS versionArticleId,
    v.versionNumber,
    v.title,
    v.abstract,
    ${contentColumn},
    v.contentHash,
    v.createdAt AS versionCreatedAt,
    ${wordCountColumn},
    s.id AS snapshotId,
    s.articleId AS snapshotArticleId,
    s.articleVersionId AS snapshotVersionId,
    s.analysisRunId,
    s.qualityScore,
    s.authorshipRisk,
    s.authorshipConfidence,
    s.authorshipIntegrity,
    s.authorshipClassification,
    s.overallScore,
    s.scoringPolicyVersion,
    s.createdAt AS snapshotCreatedAt,
    p.id AS profileId,
    p.userId AS profileUserId,
    p.displayName,
    p.username,
    p.bio,
    p.avatarUrl,
    p.websiteUrl,
    p.createdAt AS profileCreatedAt,
    p.updatedAt AS profileUpdatedAt
  `;
}

function buildWhere(query: PublicDiscoveryQuery): Prisma.Sql {
  const parts: Prisma.Sql[] = [
    Prisma.sql`a.status = ${PUBLISHED}`,
    Prisma.sql`a.publishedAt IS NOT NULL`,
  ];

  if (query.excludeArticleId) {
    parts.push(Prisma.sql`CONVERT(NVARCHAR(36), a.id) <> ${query.excludeArticleId}`);
  }

  if (query.language) {
    parts.push(Prisma.sql`a.language = ${query.language}`);
  }

  if (query.authorUsername) {
    parts.push(Prisma.sql`p.username = ${query.authorUsername}`);
  }

  if (query.categorySlug) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM [ArticleCategory] ac
      INNER JOIN [Category] c ON c.id = ac.categoryId
      WHERE ac.articleId = a.id AND c.slug = ${query.categorySlug}
    )`);
  }

  if (query.tagSlug) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1
      FROM [ArticleTag] atg
      INNER JOIN [Tag] t ON t.id = atg.tagId
      WHERE atg.articleId = a.id AND t.slug = ${query.tagSlug}
    )`);
  }

  if (query.minOverallScore) {
    parts.push(Prisma.sql`s.overallScore >= ${query.minOverallScore.value}`);
  }

  if (query.maxOverallScore) {
    parts.push(Prisma.sql`s.overallScore <= ${query.maxOverallScore.value}`);
  }

  for (const token of query.searchTokens) {
    const pattern = `%${token}%`;
    parts.push(Prisma.sql`(LOWER(v.title) LIKE ${pattern} OR LOWER(v.abstract) LIKE ${pattern})`);
  }

  if (query.cursor) {
    const publishedAt = new Date(query.cursor.publishedAt);
    const score = query.cursor.overallScore;
    const articleId = query.cursor.articleId;

    if (query.sort === 'overall_score') {
      parts.push(Prisma.sql`(
        s.overallScore < ${score}
        OR (s.overallScore = ${score} AND a.publishedAt < ${publishedAt})
        OR (
          s.overallScore = ${score}
          AND a.publishedAt = ${publishedAt}
          AND CONVERT(NVARCHAR(36), a.id) < ${articleId}
        )
      )`);
    } else {
      parts.push(Prisma.sql`(
        a.publishedAt < ${publishedAt}
        OR (a.publishedAt = ${publishedAt} AND CONVERT(NVARCHAR(36), a.id) < ${articleId})
      )`);
    }
  }

  return Prisma.join(parts, ' AND ');
}

function buildOrder(sort: PublicDiscoveryQuery['sort']): Prisma.Sql {
  if (sort === 'overall_score') {
    return Prisma.sql`s.overallScore DESC, a.publishedAt DESC, CONVERT(NVARCHAR(36), a.id) DESC`;
  }

  return Prisma.sql`a.publishedAt DESC, CONVERT(NVARCHAR(36), a.id) DESC`;
}

function toArticleRow(row: DiscoveryJoinRow): ArticleRow {
  return {
    id: row.articleId,
    authorId: row.authorId,
    slug: row.articleSlug,
    language: row.language,
    status: row.status,
    currentVersionId: row.currentVersionId,
    currentVersionNumber: row.currentVersionNumber,
    currentContentHash: row.currentContentHash,
    publishedAt: row.publishedAt,
    createdAt: row.articleCreatedAt,
    updatedAt: row.articleUpdatedAt,
  };
}

function toVersionRow(row: DiscoveryJoinRow): ArticleVersionRow {
  return {
    id: row.versionId,
    articleId: row.versionArticleId,
    versionNumber: row.versionNumber,
    title: row.title,
    abstract: row.abstract,
    content: row.content,
    contentHash: row.contentHash,
    createdAt: row.versionCreatedAt,
  };
}

function toSnapshotRow(row: DiscoveryJoinRow): ScoreSnapshotRow {
  return {
    id: row.snapshotId,
    articleId: row.snapshotArticleId,
    articleVersionId: row.snapshotVersionId,
    analysisRunId: row.analysisRunId,
    qualityScore: asDecimal(row.qualityScore),
    authorshipRisk: asDecimal(row.authorshipRisk),
    authorshipConfidence: asDecimal(row.authorshipConfidence),
    authorshipIntegrity: asDecimal(row.authorshipIntegrity),
    authorshipClassification: row.authorshipClassification,
    overallScore: asDecimal(row.overallScore),
    scoringPolicyVersion: row.scoringPolicyVersion,
    createdAt: row.snapshotCreatedAt,
  };
}

function toProfileRow(row: DiscoveryJoinRow): ProfileRow {
  return {
    id: row.profileId,
    userId: row.profileUserId,
    displayName: row.displayName,
    username: row.username,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    websiteUrl: row.websiteUrl,
    createdAt: row.profileCreatedAt,
    updatedAt: row.profileUpdatedAt,
  };
}

function asDecimal(value: Prisma.Decimal | number): Prisma.Decimal {
  return value instanceof Prisma.Decimal ? value : new Prisma.Decimal(numberFromDecimal(value).toFixed(2));
}

function resolveWordCount(row: DiscoveryJoinRow): number {
  if (typeof row.wordCount === 'number' && Number.isFinite(row.wordCount)) {
    return row.wordCount;
  }

  if (typeof row.wordCount === 'bigint') {
    return Number(row.wordCount);
  }

  return countWords(row.content);
}
