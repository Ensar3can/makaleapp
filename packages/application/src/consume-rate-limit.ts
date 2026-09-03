import { RateLimitedError } from './errors';
import type { RateLimiter } from './ports';
import { rateLimitKey } from './ports';

export async function consumeRateLimit(
  limiter: RateLimiter,
  kind: string,
  value: string,
  policy: { readonly limit: number; readonly windowMs: number },
): Promise<void> {
  const decision = await limiter.consume(rateLimitKey(kind, value), policy.limit, policy.windowMs);

  if (!decision.allowed) {
    throw new RateLimitedError(decision.retryAfterMs);
  }
}
