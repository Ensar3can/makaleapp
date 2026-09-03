import {
  OPERATION_RATE_LIMITS,
  Score,
  Slug,
  asArticleId,
  clampDiscoveryLimit,
  isPublicDiscoverySort,
  normalizeDiscoveryLanguage,
  parseSearchTokens,
  type PublicArticleDiscoveryRepository,
  type PublicDiscoveryQuery,
  type PublicDiscoverySort,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import { encodeDiscoveryCursor, decodeDiscoveryCursor } from '../discovery-cursor';
import { ValidationError } from '../errors';
import type { CacheStore, RateLimiter } from '../ports';
import { normalizeClientIp } from '../ports';
import { PUBLIC_CACHE_TTL_MS, publicListingCacheKey } from '../public-cache';
import { toPublicArticleCard, type PublicArticlePage } from '../public-article-views';
import type { UseCase } from '../use-case';

export interface SearchArticlesInput {
  readonly query?: string;
  readonly categorySlug?: string;
  readonly tagSlug?: string;
  readonly authorUsername?: string;
  readonly language?: string;
  readonly minOverallScore?: number;
  readonly maxOverallScore?: number;
  readonly excludeArticleId?: string;
  readonly sort?: string;
  readonly cursor?: string;
  readonly limit?: number;
  readonly clientIp?: string;
}

export class SearchArticlesUseCase implements UseCase<SearchArticlesInput, PublicArticlePage> {
  public constructor(
    private readonly discovery: PublicArticleDiscoveryRepository,
    private readonly rateLimiter?: RateLimiter,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(input: SearchArticlesInput): Promise<PublicArticlePage> {
    if (this.rateLimiter && input.clientIp) {
      await consumeRateLimit(
        this.rateLimiter,
        'search-ip',
        normalizeClientIp(input.clientIp),
        OPERATION_RATE_LIMITS.searchPerIp,
      );
    }
    const sort: PublicDiscoverySort = input.sort ? parseSort(input.sort) : 'overall_score';
    const cursor = decodeDiscoveryCursor(input.cursor);

    if (cursor && cursor.sort !== sort) {
      throw new ValidationError('Discovery cursor does not match the requested sort');
    }

    const minOverallScore = optionalScore(input.minOverallScore, 'Minimum score');
    const maxOverallScore = optionalScore(input.maxOverallScore, 'Maximum score');

    if (minOverallScore && maxOverallScore && minOverallScore.value > maxOverallScore.value) {
      throw new ValidationError('Minimum score cannot be greater than maximum score');
    }

    const query: PublicDiscoveryQuery = {
      searchTokens: parseSearchTokens(input.query),
      categorySlug: optionalSlug(input.categorySlug, 'Category'),
      tagSlug: optionalSlug(input.tagSlug, 'Tag'),
      authorUsername: optionalSlug(input.authorUsername, 'Author'),
      language: normalizeDiscoveryLanguage(input.language),
      minOverallScore,
      maxOverallScore,
      excludeArticleId: input.excludeArticleId ? asArticleId(input.excludeArticleId) : null,
      sort,
      cursor,
      limit: clampDiscoveryLimit(input.limit),
    };

    const listingKey = this.cache ? publicListingCacheKey(query) : null;
    if (listingKey && this.cache) {
      const cached = await this.cache.get<PublicArticlePage>(listingKey);
      if (cached) {
        return cached;
      }
    }

    const page = await this.discovery.search(query);
    const result = {
      items: page.items.map(toPublicArticleCard),
      nextCursor: page.nextCursor ? encodeDiscoveryCursor(page.nextCursor) : null,
    };

    if (listingKey && this.cache) {
      await this.cache.set(listingKey, result, PUBLIC_CACHE_TTL_MS.listing);
    }

    return result;
  }
}

function parseSort(value: string): PublicDiscoverySort {
  if (!isPublicDiscoverySort(value)) {
    throw new ValidationError('Sort must be overall_score or published_at');
  }

  return value;
}

function optionalSlug(value: string | undefined, label: string): string | null {
  if (value === undefined || value.trim().length === 0) {
    return null;
  }

  try {
    return Slug.from(value).value;
  } catch {
    throw new ValidationError(`${label} slug is invalid`);
  }
}

function optionalScore(value: number | undefined, label: string): Score | null {
  if (value === undefined) {
    return null;
  }

  try {
    return Score.from(value);
  } catch {
    throw new ValidationError(`${label} must be between 0 and 100`);
  }
}
