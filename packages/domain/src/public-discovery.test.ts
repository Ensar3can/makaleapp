import { describe, expect, it } from 'vitest';
import { InvalidDiscoveryCursorError, InvalidScoreError } from './errors';
import { asArticleId } from './ids';
import {
  assertDiscoveryCursor,
  clampDiscoveryLimit,
  compareDiscoveryRecords,
  createDiscoveryCursor,
  discoveryCursorComesAfter,
  isPublicDiscoverySort,
  normalizeDiscoveryLanguage,
  parseSearchTokens,
} from './public-discovery';
import { Score } from './score';

describe('parseSearchTokens', () => {
  it('tokenizes alphanumeric words and drops short or duplicate tokens', () => {
    expect(parseSearchTokens('  Evaluation, evaluation & AI-risk!! ')).toEqual([
      'evaluation',
      'ai',
      'risk',
    ]);
    expect(parseSearchTokens('a')).toEqual([]);
    expect(parseSearchTokens(null)).toEqual([]);
  });

  it('caps query length and token count', () => {
    const tokens = parseSearchTokens('one two three four five six seven eight nine ten');
    expect(tokens).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']);
  });
});

describe('discovery cursor and ranking', () => {
  const first = {
    overallScore: Score.from(90),
    publishedAt: new Date('2026-08-30T12:00:00.000Z'),
    articleId: asArticleId('article-a'),
  };
  const second = {
    overallScore: Score.from(80),
    publishedAt: new Date('2026-08-30T13:00:00.000Z'),
    articleId: asArticleId('article-b'),
  };

  it('orders by persisted overall score then recency', () => {
    expect(compareDiscoveryRecords('overall_score', first, second)).toBeLessThan(0);
    expect(compareDiscoveryRecords('published_at', first, second)).toBeGreaterThan(0);
  });

  it('treats a later page as after the cursor', () => {
    const cursor = createDiscoveryCursor({
      sort: 'overall_score',
      ...first,
    });

    expect(discoveryCursorComesAfter('overall_score', cursor, second)).toBe(true);
    expect(discoveryCursorComesAfter('overall_score', cursor, first)).toBe(false);
  });

  it('rejects an invalid cursor payload', () => {
    expect(() => assertDiscoveryCursor({ sort: 'popularity', overallScore: 10 })).toThrow(
      InvalidDiscoveryCursorError,
    );
    expect(() => assertDiscoveryCursor({ sort: 'overall_score', overallScore: 200, publishedAt: '2026-08-30', articleId: 'a' })).toThrow(
      InvalidScoreError,
    );
  });

  it('normalizes language, sort, and page size', () => {
    expect(normalizeDiscoveryLanguage('EN')).toBe('en');
    expect(normalizeDiscoveryLanguage('english')).toBeNull();
    expect(isPublicDiscoverySort('overall_score')).toBe(true);
    expect(isPublicDiscoverySort('views')).toBe(false);
    expect(clampDiscoveryLimit(999)).toBe(50);
    expect(clampDiscoveryLimit(undefined)).toBe(12);
  });
});
