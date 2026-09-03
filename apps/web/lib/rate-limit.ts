import type { RateLimiter } from '@aip/application';
import { createRateLimiter } from '@aip/auth';
import { getConfig } from '@aip/config';

let cached: RateLimiter | undefined;

export function getRateLimiter(): RateLimiter {
  cached ??= createRateLimiter(getConfig().REDIS_URL);
  return cached;
}
