import { describe, expect, it } from 'vitest';
import { InMemoryCacheStore } from './in-memory-cache-store';

describe('InMemoryCacheStore', () => {
  it('stores JSON values until TTL expires', async () => {
    const cache = new InMemoryCacheStore();

    await cache.set('public:homepage', { items: 2 }, 50);
    await expect(cache.get<{ items: number }>('public:homepage')).resolves.toEqual({ items: 2 });

    await new Promise((resolve) => setTimeout(resolve, 60));
    await expect(cache.get('public:homepage')).resolves.toBeNull();
  });

  it('deletes exact keys and prefixes used by public discovery', async () => {
    const cache = new InMemoryCacheStore();
    await cache.set('public:homepage', { ok: true }, 5_000);
    await cache.set('public:listing:overall_score', { page: 1 }, 5_000);
    await cache.set('public:article:demo', { slug: 'demo' }, 5_000);

    await cache.delete('public:article:demo');
    await cache.deleteByPrefix('public:listing:');

    await expect(cache.get('public:article:demo')).resolves.toBeNull();
    await expect(cache.get('public:listing:overall_score')).resolves.toBeNull();
    await expect(cache.get<{ ok: boolean }>('public:homepage')).resolves.toEqual({ ok: true });
  });
});
