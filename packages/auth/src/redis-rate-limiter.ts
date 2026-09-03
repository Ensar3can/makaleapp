import type { RateLimitDecision, RateLimiter } from '@aip/application';
import Redis from 'ioredis';

export interface RedisCounter {
  increment(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }>;
}

export class IoredisCounter implements RedisCounter {
  private readonly redis: Redis;

  public constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  public async increment(key: string, windowMs: number): Promise<{ count: number; ttlMs: number }> {
    const count = await this.redis.incr(key);

    if (count === 1) {
      await this.redis.pexpire(key, windowMs);
    }

    const ttlMs = await this.redis.pttl(key);
    return { count, ttlMs: Math.max(0, ttlMs) };
  }
}

export class RedisRateLimiter implements RateLimiter {
  public constructor(private readonly counter: RedisCounter) {}

  public async consume(key: string, limit: number, windowMs: number): Promise<RateLimitDecision> {
    const { count, ttlMs } = await this.counter.increment(key, windowMs);
    const retryAfterMs = ttlMs > 0 ? ttlMs : windowMs;

    if (count > limit) {
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfterMs,
    };
  }
}
