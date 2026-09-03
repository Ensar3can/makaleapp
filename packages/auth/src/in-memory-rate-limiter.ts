import type { RateLimitDecision, RateLimiter } from '@aip/application';

interface Bucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  public async consume(key: string, limit: number, windowMs: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterMs: windowMs };
    }

    existing.count += 1;

    if (existing.count > limit) {
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, existing.resetAt - now) };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - existing.count),
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }
}
