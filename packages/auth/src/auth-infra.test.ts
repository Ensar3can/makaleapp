import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './create-rate-limiter';
import { InMemoryRateLimiter } from './in-memory-rate-limiter';
import { RedisRateLimiter, type RedisCounter } from './redis-rate-limiter';
import { ScryptPasswordHasher } from './scrypt-password-hasher';
import { sessionCookieOptions } from './session-cookie';
import { Sha256TokenDigest } from './sha256-token-digest';

describe('ScryptPasswordHasher', () => {
  it('hashes and verifies a password without storing the plaintext', async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash('AuthorPass1234');

    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('AuthorPass1234');
    expect(await hasher.verify('AuthorPass1234', hash)).toBe(true);
    expect(await hasher.verify('WrongPassword1', hash)).toBe(false);
    expect(await hasher.verify('AuthorPass1234', 'not-a-hash')).toBe(false);
  });
});

describe('Sha256TokenDigest', () => {
  it('produces a 64-character hex digest and applies a pepper', () => {
    const digest = new Sha256TokenDigest('pepper');
    const hashed = digest.hash('session-token');

    expect(hashed).toHaveLength(64);
    expect(hashed).not.toBe(new Sha256TokenDigest().hash('session-token'));
  });
});

describe('session cookies and rate limiter', () => {
  it('marks production cookies Secure and HttpOnly', () => {
    const production = sessionCookieOptions({
      nodeEnv: 'production',
      maxAgeSeconds: 60,
      appUrl: 'https://articles.example',
    });
    const development = sessionCookieOptions({ nodeEnv: 'development', maxAgeSeconds: 60 });
    const localProduction = sessionCookieOptions({
      nodeEnv: 'production',
      maxAgeSeconds: 60,
      appUrl: 'http://localhost:3000',
    });

    expect(production.httpOnly).toBe(true);
    expect(production.secure).toBe(true);
    expect(production.sameSite).toBe('lax');
    expect(development.secure).toBe(false);
    expect(localProduction.secure).toBe(false);
  });

  it('rejects traffic after the window is exhausted', async () => {
    const limiter = new InMemoryRateLimiter();

    expect((await limiter.consume('ip:1', 2, 60_000)).allowed).toBe(true);
    expect((await limiter.consume('ip:1', 2, 60_000)).allowed).toBe(true);
    expect((await limiter.consume('ip:1', 2, 60_000)).allowed).toBe(false);
  });

  it('uses the in-memory limiter for memory:// Redis URLs', () => {
    expect(createRateLimiter('memory://local')).toBeInstanceOf(InMemoryRateLimiter);
  });

  it('enforces a sliding window through a Redis counter', async () => {
    const store = new Map<string, { count: number; resetAt: number }>();
    const counter: RedisCounter = {
      async increment(key, windowMs) {
        const now = Date.now();
        const existing = store.get(key);

        if (!existing || existing.resetAt <= now) {
          store.set(key, { count: 1, resetAt: now + windowMs });
          return { count: 1, ttlMs: windowMs };
        }

        existing.count += 1;
        return { count: existing.count, ttlMs: existing.resetAt - now };
      },
    };
    const limiter = new RedisRateLimiter(counter);

    expect((await limiter.consume('op:search', 2, 60_000)).allowed).toBe(true);
    expect((await limiter.consume('op:search', 2, 60_000)).allowed).toBe(true);
    expect((await limiter.consume('op:search', 2, 60_000)).allowed).toBe(false);
  });
});
