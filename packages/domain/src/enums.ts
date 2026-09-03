export const Role = {
  USER: 'USER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  QUEUED_FOR_ANALYSIS: 'QUEUED_FOR_ANALYSIS',
  PROCESSING: 'PROCESSING',
  ANALYSIS_COMPLETED: 'ANALYSIS_COMPLETED',
  READY_FOR_PUBLICATION: 'READY_FOR_PUBLICATION',
  REQUIRES_REVIEW: 'REQUIRES_REVIEW',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  ARCHIVED: 'ARCHIVED',
  REMOVED: 'REMOVED',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const AnalysisJobStatus = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type AnalysisJobStatus = (typeof AnalysisJobStatus)[keyof typeof AnalysisJobStatus];

export const AnalysisRunStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type AnalysisRunStatus = (typeof AnalysisRunStatus)[keyof typeof AnalysisRunStatus];

export const MetricType = {
  STRUCTURE: 'STRUCTURE',
  CONTENT_QUALITY: 'CONTENT_QUALITY',
  TOPIC_RELEVANCE: 'TOPIC_RELEVANCE',
  CITATION_QUALITY: 'CITATION_QUALITY',
  EVIDENCE: 'EVIDENCE',
  FACTUAL_RELIABILITY: 'FACTUAL_RELIABILITY',
  ORIGINALITY: 'ORIGINALITY',
  AI_AUTHORSHIP_RISK: 'AI_AUTHORSHIP_RISK',
} as const;

export type MetricType = (typeof MetricType)[keyof typeof MetricType];

export const CONTENT_ANALYSIS_METRIC_TYPES = [
  MetricType.STRUCTURE,
  MetricType.CONTENT_QUALITY,
  MetricType.TOPIC_RELEVANCE,
] as const;

export type ContentAnalysisMetricType = (typeof CONTENT_ANALYSIS_METRIC_TYPES)[number];

export const RESEARCH_ANALYSIS_METRIC_TYPES = [
  MetricType.CITATION_QUALITY,
  MetricType.EVIDENCE,
  MetricType.FACTUAL_RELIABILITY,
] as const;

export type ResearchAnalysisMetricType = (typeof RESEARCH_ANALYSIS_METRIC_TYPES)[number];

export const ORIGINALITY_ANALYSIS_METRIC_TYPES = [MetricType.ORIGINALITY] as const;

export type OriginalityAnalysisMetricType = (typeof ORIGINALITY_ANALYSIS_METRIC_TYPES)[number];

export const AUTHORSHIP_ANALYSIS_METRIC_TYPES = [MetricType.AI_AUTHORSHIP_RISK] as const;

export type AuthorshipAnalysisMetricType = (typeof AUTHORSHIP_ANALYSIS_METRIC_TYPES)[number];

export const QUALITY_SCORE_METRIC_TYPES = [
  ...CONTENT_ANALYSIS_METRIC_TYPES,
  ...RESEARCH_ANALYSIS_METRIC_TYPES,
  ...ORIGINALITY_ANALYSIS_METRIC_TYPES,
] as const;

export type QualityScoreMetricType = (typeof QUALITY_SCORE_METRIC_TYPES)[number];

export const REQUIRED_SCORE_METRIC_TYPES = [
  ...QUALITY_SCORE_METRIC_TYPES,
  ...AUTHORSHIP_ANALYSIS_METRIC_TYPES,
] as const;

export type RequiredScoreMetricType = (typeof REQUIRED_SCORE_METRIC_TYPES)[number];

export const PERSISTABLE_ANALYSIS_METRIC_TYPES = [
  ...CONTENT_ANALYSIS_METRIC_TYPES,
  ...RESEARCH_ANALYSIS_METRIC_TYPES,
  ...ORIGINALITY_ANALYSIS_METRIC_TYPES,
  ...AUTHORSHIP_ANALYSIS_METRIC_TYPES,
] as const;

export type PersistableAnalysisMetricType = (typeof PERSISTABLE_ANALYSIS_METRIC_TYPES)[number];

export const ArticleType = {
  RESEARCH: 'research',
  TECHNICAL: 'technical',
  OPINION: 'opinion',
  REVIEW: 'review',
  EDUCATIONAL: 'educational',
  NEWS: 'news',
  ESSAY: 'essay',
  OTHER: 'other',
} as const;

export type ArticleType = (typeof ArticleType)[keyof typeof ArticleType];

export const ARTICLE_TYPES = [
  ArticleType.RESEARCH,
  ArticleType.TECHNICAL,
  ArticleType.OPINION,
  ArticleType.REVIEW,
  ArticleType.EDUCATIONAL,
  ArticleType.NEWS,
  ArticleType.ESSAY,
  ArticleType.OTHER,
] as const;

export const QualitativeSignal = {
  WEAK: 'weak',
  ADEQUATE: 'adequate',
  STRONG: 'strong',
} as const;

export type QualitativeSignal = (typeof QualitativeSignal)[keyof typeof QualitativeSignal];

export const BurdenSignal = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
} as const;

export type BurdenSignal = (typeof BurdenSignal)[keyof typeof BurdenSignal];

export const ContradictionSignal = {
  NONE: 'none',
  MINOR: 'minor',
  MAJOR: 'major',
} as const;

export type ContradictionSignal = (typeof ContradictionSignal)[keyof typeof ContradictionSignal];

export const AnalysisEvidenceType = {
  ARTICLE_TYPE: 'article-type',
  DETECTED_TOPICS: 'detected-topics',
  PREPROCESS_SUMMARY: 'preprocess-summary',
  STRUCTURAL_OBSERVATION: 'structural-observation',
  MISSING_REQUIRED_SECTION: 'missing-required-section',
  CATEGORY_MISMATCH: 'category-mismatch',
  QUALITY_SIGNAL: 'quality-signal',
  EXTRACTED_CLAIM: 'extracted-claim',
  CLAIM_VERIFICATION: 'claim-verification',
  REJECTED_UNTRUSTED_URL: 'rejected-untrusted-url',
  CITATION_VERIFICATION: 'citation-verification',
  SOURCE_COLLECTION: 'source-collection',
  SSRF_BLOCKED_URL: 'ssrf-blocked-url',
  ORIGINALITY_SIGNAL: 'originality-signal',
  AUTHORSHIP_DETECTOR_OUTPUT: 'authorship-detector-output',
  AUTHORSHIP_SIGNAL: 'authorship-signal',
  AUTHORSHIP_CLASSIFICATION: 'authorship-classification',
  AUTHORSHIP_DISCLAIMER: 'authorship-disclaimer',
  MODERATION_FLAG: 'moderation-flag',
} as const;

export type AnalysisEvidenceType = (typeof AnalysisEvidenceType)[keyof typeof AnalysisEvidenceType];

export const AuthorshipClassification = {
  VERY_LOW: 'very_low',
  LOW: 'low',
  UNCERTAIN: 'uncertain',
  ELEVATED: 'elevated',
  HIGH: 'high',
} as const;

export type AuthorshipClassification =
  (typeof AuthorshipClassification)[keyof typeof AuthorshipClassification];

export const ClaimVerificationStatus = {
  SUPPORTED: 'SUPPORTED',
  PARTIALLY_SUPPORTED: 'PARTIALLY_SUPPORTED',
  DISPUTED: 'DISPUTED',
  UNVERIFIED: 'UNVERIFIED',
  OUTDATED: 'OUTDATED',
} as const;

export type ClaimVerificationStatus =
  (typeof ClaimVerificationStatus)[keyof typeof ClaimVerificationStatus];

export const CitationVerificationStatus = {
  VERIFIED: 'verified',
  PARTIALLY_VERIFIED: 'partially_verified',
  UNVERIFIED: 'unverified',
  SUSPICIOUS: 'suspicious',
  BROKEN: 'broken',
} as const;

export type CitationVerificationStatus =
  (typeof CitationVerificationStatus)[keyof typeof CitationVerificationStatus];

export const SourceType = {
  WEB: 'web',
  ACADEMIC: 'academic',
  DOI: 'doi',
  CITATION: 'citation',
  OTHER: 'other',
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export const ClaimType = {
  FACTUAL: 'factual',
  INTERPRETIVE: 'interpretive',
  OPINION: 'opinion',
} as const;

export type ClaimType = (typeof ClaimType)[keyof typeof ClaimType];

export const ClaimImportance = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type ClaimImportance = (typeof ClaimImportance)[keyof typeof ClaimImportance];

export const ClaimSourceRelation = {
  SUPPORTS: 'supports',
  CONTRADICTS: 'contradicts',
  UNCERTAIN: 'uncertain',
} as const;

export type ClaimSourceRelation = (typeof ClaimSourceRelation)[keyof typeof ClaimSourceRelation];

export const HttpUrlSafety = {
  SAFE: 'safe',
  BLOCKED: 'blocked',
  INVALID: 'invalid',
} as const;

export type HttpUrlSafety = (typeof HttpUrlSafety)[keyof typeof HttpUrlSafety];

export const AuthTokenPurpose = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AuthTokenPurpose = (typeof AuthTokenPurpose)[keyof typeof AuthTokenPurpose];

export const Permission = {
  PROFILE_READ_OWN: 'profile.read.own',
  PROFILE_UPDATE_OWN: 'profile.update.own',
  ARTICLE_CREATE: 'article.create',
  ARTICLE_MODERATE: 'article.moderate',
  USER_MANAGE: 'user.manage',
  ANALYSIS_INSPECT: 'analysis.inspect',
  SYSTEM_OBSERVE: 'system.observe',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ModerationDecision = {
  APPROVE: 'APPROVE',
  REQUEST_REVISION: 'REQUEST_REVISION',
  REJECT: 'REJECT',
} as const;

export type ModerationDecision = (typeof ModerationDecision)[keyof typeof ModerationDecision];

export const MODERATION_DECISIONS = [
  ModerationDecision.APPROVE,
  ModerationDecision.REQUEST_REVISION,
  ModerationDecision.REJECT,
] as const;

export const ModerationFlagCode = {
  HIGH_AI_AUTHORSHIP_RISK: 'HIGH_AI_AUTHORSHIP_RISK',
  CITATION_MANIPULATION: 'CITATION_MANIPULATION',
  DISPUTED_IMPORTANT_CLAIMS: 'DISPUTED_IMPORTANT_CLAIMS',
  UNSAFE_CONTENT: 'UNSAFE_CONTENT',
  SPAM: 'SPAM',
  SUSPICIOUS_DUPLICATE: 'SUSPICIOUS_DUPLICATE',
} as const;

export type ModerationFlagCode = (typeof ModerationFlagCode)[keyof typeof ModerationFlagCode];

export const AuditAction = {
  ARTICLE_FLAGGED: 'article.flagged',
  ARTICLE_MODERATED: 'article.moderated',
  ANALYSIS_JOB_RETRIED: 'analysis.job.retried',
} as const;

export const OperationalEventKind = {
  API_ERROR: 'api_error',
  WORKER_FAILURE: 'worker_failure',
  AI_PROVIDER_FAILURE: 'ai_provider_failure',
  DATABASE_FAILURE: 'database_failure',
  SLOW_QUERY: 'slow_query',
} as const;

export type OperationalEventKind = (typeof OperationalEventKind)[keyof typeof OperationalEventKind];

export const OPERATIONAL_EVENT_KINDS = [
  OperationalEventKind.API_ERROR,
  OperationalEventKind.WORKER_FAILURE,
  OperationalEventKind.AI_PROVIDER_FAILURE,
  OperationalEventKind.DATABASE_FAILURE,
  OperationalEventKind.SLOW_QUERY,
] as const;

export function isOperationalEventKind(value: string): value is OperationalEventKind {
  return (OPERATIONAL_EVENT_KINDS as readonly string[]).includes(value);
}

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
