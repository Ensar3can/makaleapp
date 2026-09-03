import { ArticleStatus } from './enums';
import { InvalidArticleStateError } from './errors';

export const ARTICLE_TRANSITIONS: Record<ArticleStatus, readonly ArticleStatus[]> = {
  [ArticleStatus.DRAFT]: [ArticleStatus.SUBMITTED, ArticleStatus.ARCHIVED, ArticleStatus.REMOVED],
  [ArticleStatus.SUBMITTED]: [
    ArticleStatus.QUEUED_FOR_ANALYSIS,
    ArticleStatus.DRAFT,
    ArticleStatus.ARCHIVED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.QUEUED_FOR_ANALYSIS]: [
    ArticleStatus.PROCESSING,
    ArticleStatus.ANALYSIS_FAILED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.PROCESSING]: [
    ArticleStatus.ANALYSIS_COMPLETED,
    ArticleStatus.ANALYSIS_FAILED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.ANALYSIS_COMPLETED]: [
    ArticleStatus.READY_FOR_PUBLICATION,
    ArticleStatus.REQUIRES_REVIEW,
    ArticleStatus.REJECTED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.READY_FOR_PUBLICATION]: [
    ArticleStatus.PUBLISHED,
    ArticleStatus.REQUIRES_REVIEW,
    ArticleStatus.ARCHIVED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.REQUIRES_REVIEW]: [
    ArticleStatus.READY_FOR_PUBLICATION,
    ArticleStatus.DRAFT,
    ArticleStatus.REJECTED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.REJECTED]: [ArticleStatus.DRAFT, ArticleStatus.ARCHIVED, ArticleStatus.REMOVED],
  [ArticleStatus.PUBLISHED]: [
    ArticleStatus.ARCHIVED,
    ArticleStatus.REMOVED,
    ArticleStatus.REQUIRES_REVIEW,
  ],
  [ArticleStatus.ANALYSIS_FAILED]: [
    ArticleStatus.QUEUED_FOR_ANALYSIS,
    ArticleStatus.DRAFT,
    ArticleStatus.ARCHIVED,
    ArticleStatus.REMOVED,
  ],
  [ArticleStatus.ARCHIVED]: [ArticleStatus.DRAFT, ArticleStatus.REMOVED],
  [ArticleStatus.REMOVED]: [],
};

export function canTransitionArticleStatus(from: ArticleStatus, to: ArticleStatus): boolean {
  return ARTICLE_TRANSITIONS[from].includes(to);
}

export function assertArticleStatusTransition(from: ArticleStatus, to: ArticleStatus): void {
  if (!canTransitionArticleStatus(from, to)) {
    throw new InvalidArticleStateError(`Cannot transition article from ${from} to ${to}`);
  }
}

export const STATUSES_INVALIDATED_BY_CONTENT_CHANGE: readonly ArticleStatus[] = [
  ArticleStatus.SUBMITTED,
  ArticleStatus.QUEUED_FOR_ANALYSIS,
  ArticleStatus.PROCESSING,
  ArticleStatus.ANALYSIS_COMPLETED,
  ArticleStatus.READY_FOR_PUBLICATION,
  ArticleStatus.REQUIRES_REVIEW,
  ArticleStatus.REJECTED,
  ArticleStatus.PUBLISHED,
  ArticleStatus.ANALYSIS_FAILED,
];
