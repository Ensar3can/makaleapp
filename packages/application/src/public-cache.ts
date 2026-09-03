import type { CacheStore } from './ports';
import type { PublicDiscoveryQuery } from '@aip/domain';

export const PUBLIC_CACHE_TTL_MS = {
  homepage: 30_000,
  categories: 300_000,
  article: 60_000,
  listing: 30_000,
} as const;

export const PUBLIC_CACHE_KEYS = {
  homepage: 'public:homepage',
  categories: 'public:categories',
  article: (slug: string) => `public:article:${slug}`,
  listingPrefix: 'public:listing:',
} as const;

export function publicListingCacheKey(query: PublicDiscoveryQuery): string | null {
  if (query.searchTokens.length > 0 || query.cursor || query.excludeArticleId) {
    return null;
  }

  return [
    'public:listing',
    query.sort,
    query.categorySlug ?? '',
    query.tagSlug ?? '',
    query.authorUsername ?? '',
    query.language ?? '',
    query.minOverallScore?.value ?? '',
    query.maxOverallScore?.value ?? '',
    query.limit,
  ].join(':');
}

export async function invalidatePublicDiscoveryCache(
  cache: CacheStore,
  slug?: string,
): Promise<void> {
  await Promise.all([
    cache.delete(PUBLIC_CACHE_KEYS.homepage),
    cache.delete(PUBLIC_CACHE_KEYS.categories),
    cache.deleteByPrefix(PUBLIC_CACHE_KEYS.listingPrefix),
    slug ? cache.delete(PUBLIC_CACHE_KEYS.article(slug)) : Promise.resolve(),
  ]);
}
