import { InvalidDiscoveryCursorError } from './errors';
import { asArticleId, type ArticleId } from './ids';
import { Score } from './score';

export const PUBLIC_DISCOVERY_SORTS = ['overall_score', 'published_at'] as const;

export type PublicDiscoverySort = (typeof PUBLIC_DISCOVERY_SORTS)[number];

export const PUBLIC_DISCOVERY_LIMITS = {
  defaultPageSize: 12,
  homepageSectionSize: 6,
  relatedSize: 4,
  maxPageSize: 50,
  sitemapSize: 5_000,
  maxQueryLength: 200,
  maxSearchTokens: 8,
  minSearchTokenLength: 2,
} as const;

export interface PublicDiscoveryCursor {
  readonly sort: PublicDiscoverySort;
  readonly overallScore: number;
  readonly publishedAt: string;
  readonly articleId: ArticleId;
}

export interface PublicDiscoveryQuery {
  readonly searchTokens: readonly string[];
  readonly categorySlug: string | null;
  readonly tagSlug: string | null;
  readonly authorUsername: string | null;
  readonly language: string | null;
  readonly minOverallScore: Score | null;
  readonly maxOverallScore: Score | null;
  readonly excludeArticleId: ArticleId | null;
  readonly sort: PublicDiscoverySort;
  readonly cursor: PublicDiscoveryCursor | null;
  readonly limit: number;
}

const SEARCH_TOKEN_PATTERN = /^[a-z0-9]+$/;
const LANGUAGE_PATTERN = /^[a-z]{2}$/;

export function isPublicDiscoverySort(value: string): value is PublicDiscoverySort {
  return (PUBLIC_DISCOVERY_SORTS as readonly string[]).includes(value);
}

export function parseSearchTokens(query: string | null | undefined): readonly string[] {
  if (query === null || query === undefined) {
    return [];
  }

  const clipped = query.trim().slice(0, PUBLIC_DISCOVERY_LIMITS.maxQueryLength).toLowerCase();

  if (clipped.length === 0) {
    return [];
  }

  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const raw of clipped.split(/[^a-z0-9]+/)) {
    if (raw.length < PUBLIC_DISCOVERY_LIMITS.minSearchTokenLength || !SEARCH_TOKEN_PATTERN.test(raw)) {
      continue;
    }

    if (seen.has(raw)) {
      continue;
    }

    seen.add(raw);
    tokens.push(raw);

    if (tokens.length === PUBLIC_DISCOVERY_LIMITS.maxSearchTokens) {
      break;
    }
  }

  return tokens;
}

export function normalizeDiscoveryLanguage(language: string | null | undefined): string | null {
  if (language === null || language === undefined) {
    return null;
  }

  const normalized = language.trim().toLowerCase();
  return LANGUAGE_PATTERN.test(normalized) ? normalized : null;
}

export function clampDiscoveryLimit(limit: number | null | undefined): number {
  if (limit === null || limit === undefined || !Number.isInteger(limit)) {
    return PUBLIC_DISCOVERY_LIMITS.defaultPageSize;
  }

  return Math.min(PUBLIC_DISCOVERY_LIMITS.maxPageSize, Math.max(1, limit));
}

export function assertDiscoveryCursor(value: unknown): PublicDiscoveryCursor {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidDiscoveryCursorError();
  }

  const record = value as Record<string, unknown>;

  if (typeof record.sort !== 'string' || !isPublicDiscoverySort(record.sort)) {
    throw new InvalidDiscoveryCursorError('Discovery cursor sort is invalid');
  }

  if (typeof record.overallScore !== 'number' || !Number.isFinite(record.overallScore)) {
    throw new InvalidDiscoveryCursorError('Discovery cursor score is invalid');
  }

  if (typeof record.publishedAt !== 'string' || Number.isNaN(Date.parse(record.publishedAt))) {
    throw new InvalidDiscoveryCursorError('Discovery cursor publishedAt is invalid');
  }

  if (typeof record.articleId !== 'string' || record.articleId.trim().length === 0) {
    throw new InvalidDiscoveryCursorError('Discovery cursor article id is invalid');
  }

  return {
    sort: record.sort,
    overallScore: Score.from(record.overallScore).value,
    publishedAt: new Date(record.publishedAt).toISOString(),
    articleId: asArticleId(record.articleId),
  };
}

export function createDiscoveryCursor(input: {
  readonly sort: PublicDiscoverySort;
  readonly overallScore: Score;
  readonly publishedAt: Date;
  readonly articleId: ArticleId;
}): PublicDiscoveryCursor {
  return {
    sort: input.sort,
    overallScore: input.overallScore.value,
    publishedAt: input.publishedAt.toISOString(),
    articleId: input.articleId,
  };
}

export function discoveryCursorComesAfter(
  sort: PublicDiscoverySort,
  cursor: PublicDiscoveryCursor,
  candidate: { readonly overallScore: Score; readonly publishedAt: Date; readonly articleId: ArticleId },
): boolean {
  const publishedAt = candidate.publishedAt.toISOString();
  const score = candidate.overallScore.value;
  const articleId = candidate.articleId;

  if (sort === 'overall_score') {
    if (score !== cursor.overallScore) {
      return score < cursor.overallScore;
    }

    if (publishedAt !== cursor.publishedAt) {
      return publishedAt < cursor.publishedAt;
    }

    return articleId < cursor.articleId;
  }

  if (publishedAt !== cursor.publishedAt) {
    return publishedAt < cursor.publishedAt;
  }

  return articleId < cursor.articleId;
}

export function compareDiscoveryRecords(
  sort: PublicDiscoverySort,
  left: { readonly overallScore: Score; readonly publishedAt: Date; readonly articleId: ArticleId },
  right: { readonly overallScore: Score; readonly publishedAt: Date; readonly articleId: ArticleId },
): number {
  if (sort === 'overall_score' && left.overallScore.value !== right.overallScore.value) {
    return right.overallScore.value - left.overallScore.value;
  }

  const publishedDelta = right.publishedAt.getTime() - left.publishedAt.getTime();

  if (publishedDelta !== 0) {
    return publishedDelta;
  }

  return left.articleId < right.articleId ? 1 : left.articleId > right.articleId ? -1 : 0;
}
