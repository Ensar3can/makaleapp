import { describe, expect, it } from 'vitest';
import {
  ARTICLE_TRANSITIONS,
  assertArticleStatusTransition,
  canTransitionArticleStatus,
} from './article-status-machine';
import { ArticleStatus } from './enums';
import { InvalidArticleStateError } from './errors';

describe('article status machine', () => {
  it('allows the primary analysis and publication path', () => {
    const path: ArticleStatus[] = [
      ArticleStatus.DRAFT,
      ArticleStatus.SUBMITTED,
      ArticleStatus.QUEUED_FOR_ANALYSIS,
      ArticleStatus.PROCESSING,
      ArticleStatus.ANALYSIS_COMPLETED,
      ArticleStatus.READY_FOR_PUBLICATION,
      ArticleStatus.PUBLISHED,
    ];

    for (let index = 0; index < path.length - 1; index += 1) {
      const from = path[index];
      const to = path[index + 1];
      expect(from).toBeDefined();
      expect(to).toBeDefined();
      expect(canTransitionArticleStatus(from!, to!)).toBe(true);
    }
  });

  it('allows completed analysis to branch into review or rejection', () => {
    expect(
      canTransitionArticleStatus(ArticleStatus.ANALYSIS_COMPLETED, ArticleStatus.REQUIRES_REVIEW),
    ).toBe(true);
    expect(canTransitionArticleStatus(ArticleStatus.ANALYSIS_COMPLETED, ArticleStatus.REJECTED)).toBe(
      true,
    );
    expect(canTransitionArticleStatus(ArticleStatus.REQUIRES_REVIEW, ArticleStatus.READY_FOR_PUBLICATION)).toBe(
      true,
    );
    expect(canTransitionArticleStatus(ArticleStatus.REQUIRES_REVIEW, ArticleStatus.DRAFT)).toBe(true);
    expect(canTransitionArticleStatus(ArticleStatus.REJECTED, ArticleStatus.DRAFT)).toBe(true);
  });

  it('treats REMOVED as terminal', () => {
    expect(ARTICLE_TRANSITIONS[ArticleStatus.REMOVED]).toEqual([]);
    expect(() =>
      assertArticleStatusTransition(ArticleStatus.REMOVED, ArticleStatus.DRAFT),
    ).toThrow(InvalidArticleStateError);
  });

  it('rejects unpublished shortcuts', () => {
    expect(canTransitionArticleStatus(ArticleStatus.DRAFT, ArticleStatus.PUBLISHED)).toBe(false);
    expect(canTransitionArticleStatus(ArticleStatus.ANALYSIS_COMPLETED, ArticleStatus.PUBLISHED)).toBe(
      false,
    );
    expect(() =>
      assertArticleStatusTransition(ArticleStatus.DRAFT, ArticleStatus.PROCESSING),
    ).toThrow(/Cannot transition article from DRAFT to PROCESSING/);
  });
});
