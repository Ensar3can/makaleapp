import type { RateLimiter } from '@aip/application';
import { InMemoryRateLimiter } from './in-memory-rate-limiter';
import { IoredisCounter, RedisRateLimiter } from './redis-rate-limiter';

export function createRateLimiter(redisUrl: string): RateLimiter {
  if (redisUrl.startsWith('memory:')) {
    return new InMemoryRateLimiter();
  }

  return new RedisRateLimiter(new IoredisCounter(redisUrl));
}
