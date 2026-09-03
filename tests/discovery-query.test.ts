import { describe, expect, it } from 'vitest';
import { discoveryQueryFromSearchParams, nextPageHref } from '../apps/web/lib/discovery/query';

describe('discoveryQueryFromSearchParams', () => {
  it('maps catalog filter and sort params without calculating scores', () => {
    expect(
      discoveryQueryFromSearchParams({
        q: 'climate',
        category: 'physics',
        minScore: '70',
        maxScore: '95',
        sort: 'published_at',
        cursor: 'abc',
      }),
    ).toEqual({
      query: 'climate',
      categorySlug: 'physics',
      tagSlug: undefined,
      authorUsername: undefined,
      language: undefined,
      minOverallScore: 70,
      maxOverallScore: 95,
      sort: 'published_at',
      cursor: 'abc',
      limit: undefined,
    });
  });
});

describe('nextPageHref', () => {
  it('preserves filters and replaces the listing cursor', () => {
    expect(
      nextPageHref('/articles', { q: 'ai', sort: 'overall_score', cursor: 'old' }, 'new-cursor'),
    ).toBe('/articles?q=ai&sort=overall_score&cursor=new-cursor');
    expect(nextPageHref('/search', { q: 'ai' }, null)).toBeNull();
  });
});
