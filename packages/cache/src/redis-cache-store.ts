import type { CacheStore } from '@aip/application';
import Redis from 'ioredis';

export class RedisCacheStore implements CacheStore {
  private readonly redis: Redis;

  public constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!Number.isInteger(ttlMs) || ttlMs < 1) {
      throw new Error('Cache TTL must be a positive integer');
    }

    try {
      await this.redis.set(key, JSON.stringify(value), 'PX', ttlMs);
    } catch {
      return;
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      return;
    }
  }

  public async deleteByPrefix(prefix: string): Promise<void> {
    try {
      let cursor = '0';

      do {
        const [next, keys] = await this.redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      return;
    }
  }
}
