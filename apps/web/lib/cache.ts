import type { CacheStore } from '@aip/application';
import { createCacheStore } from '@aip/cache';
import { getConfig } from '@aip/config';

let cached: CacheStore | undefined;

export function getCacheStore(): CacheStore {
  cached ??= createCacheStore(getConfig().REDIS_URL);
  return cached;
}
