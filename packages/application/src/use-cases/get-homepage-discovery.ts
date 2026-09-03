import { PUBLIC_DISCOVERY_LIMITS, type CategoryRepository } from '@aip/domain';
import { toPublicCategory, type PublicCategory } from '../article-views';
import type { CacheStore } from '../ports';
import { PUBLIC_CACHE_KEYS, PUBLIC_CACHE_TTL_MS } from '../public-cache';
import type { HomepageDiscovery } from '../public-article-views';
import type { UseCase } from '../use-case';
import { SearchArticlesUseCase } from './search-articles';

export class GetHomepageDiscoveryUseCase implements UseCase<void, HomepageDiscovery> {
  public constructor(
    private readonly search: SearchArticlesUseCase,
    private readonly categories: CategoryRepository,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(): Promise<HomepageDiscovery> {
    const cached = this.cache ? await this.cache.get<HomepageDiscovery>(PUBLIC_CACHE_KEYS.homepage) : null;

    if (cached) {
      return cached;
    }

    const [topRated, recentlyPublished, categories] = await Promise.all([
      this.search.execute({
        sort: 'overall_score',
        limit: PUBLIC_DISCOVERY_LIMITS.homepageSectionSize,
      }),
      this.search.execute({
        sort: 'published_at',
        limit: PUBLIC_DISCOVERY_LIMITS.homepageSectionSize,
      }),
      this.categories.listActive(),
    ]);

    const result = {
      topRated: topRated.items,
      recentlyPublished: recentlyPublished.items,
      categories: categories.map(toPublicCategory) satisfies readonly PublicCategory[],
    };

    await this.cache?.set(PUBLIC_CACHE_KEYS.homepage, result, PUBLIC_CACHE_TTL_MS.homepage);
    return result;
  }
}
