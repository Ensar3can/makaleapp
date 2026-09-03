import { type CategoryRepository } from '@aip/domain';
import { toPublicCategory, type PublicCategory } from '../article-views';
import type { CacheStore } from '../ports';
import { PUBLIC_CACHE_KEYS, PUBLIC_CACHE_TTL_MS } from '../public-cache';
import type { UseCase } from '../use-case';

export class ListPublicCategoriesUseCase implements UseCase<void, readonly PublicCategory[]> {
  public constructor(
    private readonly categories: CategoryRepository,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(): Promise<readonly PublicCategory[]> {
    const cached = this.cache
      ? await this.cache.get<readonly PublicCategory[]>(PUBLIC_CACHE_KEYS.categories)
      : null;

    if (cached) {
      return cached;
    }

    const categories = (await this.categories.listActive()).map(toPublicCategory);
    await this.cache?.set(PUBLIC_CACHE_KEYS.categories, categories, PUBLIC_CACHE_TTL_MS.categories);
    return categories;
  }
}
