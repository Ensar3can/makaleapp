import type { ArticleId, ArticleVersionId } from './ids';

export const DomainEventName = {
  ArticleSubmitted: 'ArticleSubmitted',
  ArticleAnalysisRequested: 'ArticleAnalysisRequested',
  ArticleAnalysisCompleted: 'ArticleAnalysisCompleted',
  ArticlePublished: 'ArticlePublished',
  ArticleFlaggedForReview: 'ArticleFlaggedForReview',
} as const;

export type DomainEventName = (typeof DomainEventName)[keyof typeof DomainEventName];

export interface DomainEvent {
  readonly name: DomainEventName;
  readonly occurredAt: Date;
  readonly articleId: ArticleId;
  readonly articleVersionId: ArticleVersionId | null;
}

export function articleSubmitted(
  articleId: ArticleId,
  articleVersionId: ArticleVersionId,
  occurredAt: Date,
): DomainEvent {
  return {
    name: DomainEventName.ArticleSubmitted,
    occurredAt,
    articleId,
    articleVersionId,
  };
}

export function articleAnalysisRequested(
  articleId: ArticleId,
  articleVersionId: ArticleVersionId,
  occurredAt: Date,
): DomainEvent {
  return {
    name: DomainEventName.ArticleAnalysisRequested,
    occurredAt,
    articleId,
    articleVersionId,
  };
}

export function articleAnalysisCompleted(
  articleId: ArticleId,
  articleVersionId: ArticleVersionId,
  occurredAt: Date,
): DomainEvent {
  return {
    name: DomainEventName.ArticleAnalysisCompleted,
    occurredAt,
    articleId,
    articleVersionId,
  };
}

export function articlePublished(
  articleId: ArticleId,
  articleVersionId: ArticleVersionId,
  occurredAt: Date,
): DomainEvent {
  return {
    name: DomainEventName.ArticlePublished,
    occurredAt,
    articleId,
    articleVersionId,
  };
}

export function articleFlaggedForReview(
  articleId: ArticleId,
  articleVersionId: ArticleVersionId | null,
  occurredAt: Date,
): DomainEvent {
  return {
    name: DomainEventName.ArticleFlaggedForReview,
    occurredAt,
    articleId,
    articleVersionId,
  };
}
