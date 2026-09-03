export { assertNever } from './assert-never';

export {
  AccountLockedError,
  AnalysisNotCompletedError,
  IncompleteAnalysisScoreError,
  ArticleAlreadyPublishedError,
  ArticleNotFoundError,
  CategoryNotFoundError,
  ProfileNotFoundError,
  EmailNotVerifiedError,
  AuthTokenInvalidError,
  DomainError,
  EmailAlreadyRegisteredError,
  InsufficientPermissionError,
  InvalidAnalysisEvidenceError,
  InvalidAnalysisJobStateError,
  InvalidAnalysisMetricError,
  InvalidAnalysisRunStateError,
  InvalidArticleEvaluationPolicyError,
  InvalidSourceReferenceError,
  InvalidModerationReviewError,
  AnalysisJobNotFoundError,
  InvalidAiUsageRecordError,
  InvalidAuditLogError,
  InvalidOperationalEventError,
  InvalidArticleStateError,
  InvalidArticleVersionError,
  InvalidDiscoveryCursorError,
  InvalidCategoryError,
  InvalidContentHashError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidIdentifierError,
  InvalidPasswordError,
  InvalidProfileError,
  InvalidScoreError,
  InvalidScoreSnapshotError,
  InvalidScoringPolicyError,
  ScoringPolicyNotFoundError,
  InvalidSessionError,
  InvalidSlugError,
  InvalidTagError,
  InvalidUserStateError,
  SessionExpiredError,
  UnauthenticatedError,
  UnauthorizedArticleAccessError,
  UnauthorizedRoleAssignmentError,
  UsernameTakenError,
} from './errors';

export {
  asAnalysisEvidenceId,
  asAnalysisJobId,
  asAnalysisMetricId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asAuthTokenId,
  asCategoryId,
  asLoginAttemptId,
  asModerationReviewId,
  asAiUsageRecordId,
  asAuditLogId,
  asOperationalEventId,
  asProfileId,
  asScoreSnapshotId,
  asSourceReferenceId,
  asSessionId,
  asTagId,
  asUserId,
} from './ids';
export type {
  AnalysisEvidenceId,
  AnalysisJobId,
  AnalysisMetricId,
  AnalysisRunId,
  ArticleId,
  ArticleVersionId,
  AuthTokenId,
  Brand,
  CategoryId,
  LoginAttemptId,
  ModerationReviewId,
  AiUsageRecordId,
  AuditLogId,
  OperationalEventId,
  ProfileId,
  ScoreSnapshotId,
  SessionId,
  SourceReferenceId,
  TagId,
  UserId,
} from './ids';

export {
  ARTICLE_TYPES,
  AnalysisEvidenceType,
  AnalysisJobStatus,
  AnalysisRunStatus,
  ArticleStatus,
  ArticleType,
  AuthorshipClassification,
  BurdenSignal,
  AUTHORSHIP_ANALYSIS_METRIC_TYPES,
  CONTENT_ANALYSIS_METRIC_TYPES,
  ORIGINALITY_ANALYSIS_METRIC_TYPES,
  QUALITY_SCORE_METRIC_TYPES,
  RESEARCH_ANALYSIS_METRIC_TYPES,
  REQUIRED_SCORE_METRIC_TYPES,
  PERSISTABLE_ANALYSIS_METRIC_TYPES,
  ContradictionSignal,
  AuthTokenPurpose,
  CitationVerificationStatus,
  ClaimVerificationStatus,
  ClaimImportance,
  ClaimSourceRelation,
  ClaimType,
  HttpUrlSafety,
  MetricType,
  ModerationDecision,
  MODERATION_DECISIONS,
  ModerationFlagCode,
  AuditAction,
  OperationalEventKind,
  OPERATIONAL_EVENT_KINDS,
  isOperationalEventKind,
  QualitativeSignal,
  Permission,
  Role,
  SourceType,
  UserStatus,
} from './enums';
export type {
  AuthorshipAnalysisMetricType,
  ContentAnalysisMetricType,
  OriginalityAnalysisMetricType,
  PersistableAnalysisMetricType,
  QualityScoreMetricType,
  RequiredScoreMetricType,
  ResearchAnalysisMetricType,
} from './enums';

export {
  PUBLIC_DISCOVERY_LIMITS,
  PUBLIC_DISCOVERY_SORTS,
  assertDiscoveryCursor,
  clampDiscoveryLimit,
  compareDiscoveryRecords,
  createDiscoveryCursor,
  discoveryCursorComesAfter,
  isPublicDiscoverySort,
  normalizeDiscoveryLanguage,
  parseSearchTokens,
} from './public-discovery';
export type { PublicDiscoveryCursor, PublicDiscoveryQuery, PublicDiscoverySort } from './public-discovery';

export { Slug } from './slug';
export { EmailAddress } from './email-address';
export { ContentHash } from './content-hash';
export { Score } from './score';

export { ScoringPolicy } from './scoring-policy';
export type {
  AuthorshipClassificationThresholds,
  ComputedArticleScore,
  QualityMetricScores,
  QualityWeights,
  ScoringPolicyProps,
} from './scoring-policy';
export { ScoringEngine } from './scoring-engine';

export { AIAuthorshipAssessment } from './ai-authorship-assessment';
export type { AIAuthorshipSignal } from './ai-authorship-assessment';

export {
  DomainEventName,
  articleAnalysisCompleted,
  articleAnalysisRequested,
  articleFlaggedForReview,
  articlePublished,
  articleSubmitted,
} from './domain-events';
export type { DomainEvent } from './domain-events';

export {
  ARTICLE_TRANSITIONS,
  STATUSES_INVALIDATED_BY_CONTENT_CHANGE,
  assertArticleStatusTransition,
  canTransitionArticleStatus,
} from './article-status-machine';
export {
  ANALYSIS_JOB_TRANSITIONS,
  ANALYSIS_RUN_TRANSITIONS,
  assertAnalysisJobTransition,
  assertAnalysisRunTransition,
} from './analysis-status-machines';

export { Article } from './article';
export type {
  ArticleCommandResult,
  ArticleDraftInput,
  ArticleDraftResult,
  ArticleProps,
  ArticleRevisionInput,
  ArticleRevisionResult,
} from './article';

export { ArticleVersion } from './article-version';
export type { ArticleVersionProps } from './article-version';

export { AnalysisJob } from './analysis-job';
export type { AnalysisJobProps } from './analysis-job';

export { AnalysisRun } from './analysis-run';
export type { AnalysisRunProps } from './analysis-run';

export { AnalysisMetric } from './analysis-metric';
export type { AnalysisMetricProps } from './analysis-metric';

export { AnalysisEvidence } from './analysis-evidence';
export type { AnalysisEvidenceProps } from './analysis-evidence';

export { ArticleEvaluationPolicy } from './article-evaluation-policy';
export type {
  ArticleEvaluationPolicyProps,
  ResearchExpectations,
  StructuralExpectations,
} from './article-evaluation-policy';

export { countWords, preprocessArticle } from './article-preprocessor';
export type {
  PreprocessArticleInput,
  PreprocessedArticle,
  PreprocessedStructuralMetrics,
} from './article-preprocessor';

export { scoreContentAnalysis } from './content-analysis-scoring';
export type { ScoreContentAnalysisInput } from './content-analysis-scoring';
export type {
  ContentAnalysisResult,
  ContentEvidenceDraft,
  ContentMetricDraft,
  QualityObservations,
  StructureObservations,
  TopicObservations,
  TypeClassification,
} from './content-analysis';

export { inspectHttpUrl, isBlockedIpAddress, isTrustedSourceUrl, normalizeHttpUrl } from './http-url-safety';
export type { HttpUrlInspection } from './http-url-safety';

export { CLAIM_VERIFICATION_BUDGET, selectClaimsForVerification } from './research-analysis';
export type {
  CitationCheck,
  ClaimEvaluationObservation,
  CollectedSource,
  ExtractedClaim,
  ResearchAnalysisResult,
  ResearchEvidenceDraft,
  ResearchMetricDraft,
  SourceReferenceDraft,
  TrustedClaimEvaluation,
} from './research-analysis';
export { scoreResearchAnalysis } from './research-analysis-scoring';
export type { ScoreResearchAnalysisInput } from './research-analysis-scoring';

export { scoreOriginality } from './originality-analysis-scoring';
export type { ScoreOriginalityInput } from './originality-analysis-scoring';
export type {
  OriginalityAnalysisResult,
  OriginalityEvidenceDraft,
  OriginalityMetricDraft,
} from './originality-analysis';

export {
  AUTHORSHIP_DETECTOR_WEIGHTS,
  AUTHORSHIP_ENSEMBLE_VERSION,
  AUTHORSHIP_RISK_DISCLAIMER,
} from './authorship-analysis';
export type {
  AssessAuthorshipInput,
  AuthorshipAnalysisResult,
  AuthorshipDetectorObservation,
  AuthorshipEvidenceDraft,
  AuthorshipMetricDraft,
  AuthorshipSignalObservation,
} from './authorship-analysis';
export { AIAuthorshipAssessmentService, assessAuthorship } from './authorship-analysis-scoring';

export { SourceReference } from './source-reference';
export type { SourceReferenceProps } from './source-reference';

export { ScoreSnapshot } from './score-snapshot';
export type { ScoreSnapshotProps } from './score-snapshot';

export { ModerationReview, isModerationDecision } from './moderation-review';
export type { ModerationReviewProps } from './moderation-review';

export { AuditLog } from './audit-log';
export type { AuditLogProps } from './audit-log';

export { AiUsageRecord } from './ai-usage-record';
export type { AiUsageRecordProps } from './ai-usage-record';

export { OperationalEvent, sanitizeOperationalMessage } from './operational-event';
export type { OperationalEventProps } from './operational-event';

export {
  OBSERVABILITY_LIMITS,
  analysisDurationMs,
  assembleObservabilityDashboard,
  averageOrNull,
  ratioOrNull,
  startOfUtcDay,
  startOfUtcMonth,
} from './observability';
export type {
  MonitoredJobQuery,
  MonitoredJobRecord,
  ObservabilityDashboard,
  ObservabilityRawSnapshot,
  ObservabilityStageCost,
} from './observability';

export { evaluateModerationFlags, metricTypeForFlag } from './moderation-flag';
export type { EvaluateModerationFlagsInput, ModerationFlag } from './moderation-flag';

export { User } from './user';
export type { UserProps } from './user';

export { Profile } from './profile';
export type { ProfileProps } from './profile';

export { Session } from './session';
export type { SessionProps } from './session';

export { AuthToken } from './auth-token';
export type { AuthTokenProps } from './auth-token';

export { LoginAttempt, ACCOUNT_LOCK_POLICY, isAccountLocked } from './login-attempt';
export type { LoginAttemptProps } from './login-attempt';

export { assertPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './password-policy';
export { assertAnyRole, assertPermission, hasPermission, permissionsFor } from './permissions';
export { AUTH_RATE_LIMITS, AUTH_TTL, OPERATION_RATE_LIMITS } from './auth-ttl';
export { buildSecurityHeaders } from './security-headers';
export { PUBLIC_HTTP_CACHE_CONTROL, cacheControlForRequest, isPublicCacheablePath } from './http-cache';
export { checkMutatingRequestOrigin, normalizeOrigin } from './request-origin';
export type { RequestOriginCheck } from './request-origin';
export { isValidIpAddress, parseClientIp } from './client-ip';
export { assertPublicHttpsUrl, isSafePublicHref } from './public-https-url';
export {
  UNTRUSTED_DATA_FENCE_BEGIN,
  UNTRUSTED_DATA_FENCE_END,
  escapeJsonLd,
  fenceUntrustedPayload,
  sanitizeUntrustedText,
} from './untrusted-text';
export { UPLOAD_LIMITS, inspectUploadedFile } from './uploaded-file';
export type { UploadedFileInspection } from './uploaded-file';
export { isAnalysisCostWithinBudget } from './analysis-cost';

export { Category } from './category';
export type { CategoryProps } from './category';

export { Tag } from './tag';
export type { TagProps } from './tag';

export type {
  PublicDiscoveryPage,
  PublicDiscoveryRecord,
  PublicSitemapEntry,
} from './repositories';
export type {
  AiUsageRecordRepository,
  AnalysisEvidenceRepository,
  AnalysisJobRepository,
  AnalysisMetricRepository,
  AnalysisRunRepository,
  ArticleRepository,
  ObservabilityRepository,
  OperationalEventRepository,
  ArticleTaxonomyLinks,
  ArticleTaxonomyRepository,
  ArticleVersionRepository,
  AuthTokenRepository,
  CategoryRepository,
  LoginAttemptRepository,
  ModerationReviewRepository,
  AuditLogRepository,
  ProfileRepository,
  PublicArticleDiscoveryRepository,
  ScoreSnapshotRepository,
  ScoringPolicyRepository,
  SessionRepository,
  SourceReferenceRepository,
  TagRepository,
  UserRepository,
} from './repositories';
