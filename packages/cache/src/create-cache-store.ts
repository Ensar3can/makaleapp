import type { CacheStore } from '@aip/application';
import { InMemoryCacheStore } from './in-memory-cache-store';
import { RedisCacheStore } from './redis-cache-store';

export function createCacheStore(redisUrl: string): CacheStore {
  if (redisUrl.startsWith('memory:')) {
    return new InMemoryCacheStore();
  }

  return new RedisCacheStore(redisUrl);
}
