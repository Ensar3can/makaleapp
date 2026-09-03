import type {
  AnalysisEvidence,
  Article,
  ArticleVersion,
  AuthorshipClassification,
  ModerationFlagCode,
  ModerationReview,
  Profile,
  ScoreSnapshot,
  User,
} from '@aip/domain';
import { AnalysisEvidenceType } from '@aip/domain';
import {
  toAuthorContentAnalysis,
  toAuthorScoreView,
  type AuthorContentAnalysisView,
  type AuthorScoreView,
} from './article-views';

export interface ModerationFlagView {
  readonly code: ModerationFlagCode | string;
  readonly summary: string;
}

export interface ModerationReviewView {
  readonly id: string;
  readonly decision: ModerationReview['decision'];
  readonly reason: string;
  readonly notes: string;
  readonly moderatorId: string;
  readonly createdAt: string;
}

export interface ModerationQueueItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: Article['status'];
  readonly updatedAt: string;
  readonly authorDisplayName: string;
  readonly overallScore: number | null;
  readonly authorshipRisk: number | null;
  readonly authorshipConfidence: number | null;
  readonly authorshipClassification: AuthorshipClassification | null;
  readonly flags: readonly ModerationFlagView[];
}

export interface ModerationArticleDetail extends ModerationQueueItem {
  readonly abstract: string;
  readonly content: string;
  readonly language: string;
  readonly currentVersionNumber: number;
  readonly authorEmail: string;
  readonly authorUsername: string;
  readonly score: AuthorScoreView | null;
  readonly contentAnalysis: AuthorContentAnalysisView | null;
  readonly reviews: readonly ModerationReviewView[];
}

export function flagsFromEvidence(evidence: readonly AnalysisEvidence[]): readonly ModerationFlagView[] {
  return evidence
    .filter((item) => item.evidenceType === AnalysisEvidenceType.MODERATION_FLAG)
    .map((item) => ({
      code: item.claim,
      summary: item.evidence,
    }));
}

export function toModerationReviewView(review: ModerationReview): ModerationReviewView {
  return {
    id: review.id,
    decision: review.decision,
    reason: review.reason,
    notes: review.notes,
    moderatorId: review.moderatorId,
    createdAt: review.createdAt.toISOString(),
  };
}

export function toModerationQueueItem(input: {
  article: Article;
  version: ArticleVersion;
  author: Profile;
  snapshot: ScoreSnapshot | null;
  flags: readonly ModerationFlagView[];
}): ModerationQueueItem {
  return {
    id: input.article.id,
    slug: input.article.slug.value,
    title: input.version.title,
    status: input.article.status,
    updatedAt: input.article.updatedAt.toISOString(),
    authorDisplayName: input.author.displayName,
    overallScore: input.snapshot?.overallScore.value ?? null,
    authorshipRisk: input.snapshot?.authorshipRisk.value ?? null,
    authorshipConfidence: input.snapshot?.authorshipConfidence.value ?? null,
    authorshipClassification: input.snapshot?.authorshipClassification ?? null,
    flags: input.flags,
  };
}

export function toModerationArticleDetail(input: {
  article: Article;
  version: ArticleVersion;
  author: Profile;
  authorUser: User;
  snapshot: ScoreSnapshot | null;
  flags: readonly ModerationFlagView[];
  reviews: readonly ModerationReview[];
  contentAnalysis: AuthorContentAnalysisView | null;
}): ModerationArticleDetail {
  return {
    ...toModerationQueueItem(input),
    abstract: input.version.abstract,
    content: input.version.content,
    language: input.article.language,
    currentVersionNumber: input.article.currentVersionNumber,
    authorEmail: input.authorUser.email.value,
    authorUsername: input.author.username.value,
    score: toAuthorScoreView(input.snapshot),
    contentAnalysis: input.contentAnalysis,
    reviews: input.reviews.map(toModerationReviewView),
  };
}

export { toAuthorContentAnalysis };
