import { InvalidIdentifierError } from './errors';

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type UserId = Brand<string, 'UserId'>;
export type ProfileId = Brand<string, 'ProfileId'>;
export type ArticleId = Brand<string, 'ArticleId'>;
export type ArticleVersionId = Brand<string, 'ArticleVersionId'>;
export type CategoryId = Brand<string, 'CategoryId'>;
export type TagId = Brand<string, 'TagId'>;
export type AnalysisJobId = Brand<string, 'AnalysisJobId'>;
export type AnalysisRunId = Brand<string, 'AnalysisRunId'>;
export type AnalysisMetricId = Brand<string, 'AnalysisMetricId'>;
export type AnalysisEvidenceId = Brand<string, 'AnalysisEvidenceId'>;
export type ScoreSnapshotId = Brand<string, 'ScoreSnapshotId'>;
export type SourceReferenceId = Brand<string, 'SourceReferenceId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type AuthTokenId = Brand<string, 'AuthTokenId'>;
export type LoginAttemptId = Brand<string, 'LoginAttemptId'>;
export type ModerationReviewId = Brand<string, 'ModerationReviewId'>;
export type AuditLogId = Brand<string, 'AuditLogId'>;
export type AiUsageRecordId = Brand<string, 'AiUsageRecordId'>;
export type OperationalEventId = Brand<string, 'OperationalEventId'>;

function brandId<B extends string>(brand: B, value: string): Brand<string, B> {
  if (value.trim().length === 0) {
    throw new InvalidIdentifierError(brand);
  }

  return value as Brand<string, B>;
}

export const asUserId = (value: string): UserId => brandId('UserId', value);
export const asProfileId = (value: string): ProfileId => brandId('ProfileId', value);
export const asArticleId = (value: string): ArticleId => brandId('ArticleId', value);
export const asArticleVersionId = (value: string): ArticleVersionId =>
  brandId('ArticleVersionId', value);
export const asCategoryId = (value: string): CategoryId => brandId('CategoryId', value);
export const asTagId = (value: string): TagId => brandId('TagId', value);
export const asAnalysisJobId = (value: string): AnalysisJobId => brandId('AnalysisJobId', value);
export const asAnalysisRunId = (value: string): AnalysisRunId => brandId('AnalysisRunId', value);
export const asAnalysisMetricId = (value: string): AnalysisMetricId =>
  brandId('AnalysisMetricId', value);
export const asAnalysisEvidenceId = (value: string): AnalysisEvidenceId =>
  brandId('AnalysisEvidenceId', value);
export const asScoreSnapshotId = (value: string): ScoreSnapshotId =>
  brandId('ScoreSnapshotId', value);
export const asSourceReferenceId = (value: string): SourceReferenceId =>
  brandId('SourceReferenceId', value);
export const asSessionId = (value: string): SessionId => brandId('SessionId', value);
export const asAuthTokenId = (value: string): AuthTokenId => brandId('AuthTokenId', value);
export const asLoginAttemptId = (value: string): LoginAttemptId => brandId('LoginAttemptId', value);
export const asModerationReviewId = (value: string): ModerationReviewId =>
  brandId('ModerationReviewId', value);
export const asAuditLogId = (value: string): AuditLogId => brandId('AuditLogId', value);
export const asAiUsageRecordId = (value: string): AiUsageRecordId => brandId('AiUsageRecordId', value);
export const asOperationalEventId = (value: string): OperationalEventId =>
  brandId('OperationalEventId', value);
