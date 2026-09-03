import {
  AiUsageRecord,
  AnalysisEvidence,
  AnalysisJob,
  AnalysisMetric,
  AnalysisRun,
  OperationalEvent,
  Article,
  ArticleVersion,
  AuditLog,
  AuthToken,
  AuthorshipClassification,
  Category,
  ContentHash,
  EmailAddress,
  LoginAttempt,
  ModerationReview,
  Profile,
  Role,
  Score,
  ScoreSnapshot,
  ScoringPolicy,
  Session,
  Slug,
  SourceReference,
  Tag,
  User,
  UserStatus,
  asAiUsageRecordId,
  asAnalysisEvidenceId,
  asOperationalEventId,
  asAnalysisJobId,
  asAnalysisMetricId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asAuthTokenId,
  asCategoryId,
  asLoginAttemptId,
  asModerationReviewId,
  asAuditLogId,
  asProfileId,
  asScoreSnapshotId,
  asSessionId,
  asSourceReferenceId,
  asTagId,
  asUserId,
  type AnalysisJobStatus,
  type OperationalEventKind,
  type AnalysisRunStatus,
  type MetricType,
  type ArticleStatus,
  type AuthTokenPurpose,
  type CitationVerificationStatus,
  type ModerationDecision,
  type QualityWeights,
  type ScoringPolicyProps,
  type SourceType,
} from '@aip/domain';
import type {
  AiUsageRecord as AiUsageRecordRow,
  AnalysisEvidence as AnalysisEvidenceRow,
  OperationalEvent as OperationalEventRow,
  AnalysisJob as AnalysisJobRow,
  AnalysisMetric as AnalysisMetricRow,
  AnalysisRun as AnalysisRunRow,
  Article as ArticleRow,
  ArticleVersion as ArticleVersionRow,
  AuditLog as AuditLogRow,
  AuthToken as AuthTokenRow,
  Category as CategoryRow,
  LoginAttempt as LoginAttemptRow,
  ModerationReview as ModerationReviewRow,
  Profile as ProfileRow,
  ScoreSnapshot as ScoreSnapshotRow,
  ScoringPolicy as ScoringPolicyRow,
  Session as SessionRow,
  SourceReference as SourceReferenceRow,
  Tag as TagRow,
  User as UserRow,
} from './generated/client';
import { Prisma } from './generated/client';

export function decimalFromScore(score: Score): Prisma.Decimal {
  return new Prisma.Decimal(score.value.toFixed(2));
}

export function decimalFromAmount(value: number, places: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(places));
}

export function numberFromDecimal(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function scoreFromDecimal(value: Prisma.Decimal | number): Score {
  return Score.from(numberFromDecimal(value));
}

export function toUser(row: UserRow): User {
  return User.reconstitute({
    id: asUserId(row.id),
    email: EmailAddress.from(row.email),
    passwordHash: row.passwordHash,
    role: row.role as Role,
    status: row.status as UserStatus,
    emailVerifiedAt: row.emailVerifiedAt,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toSession(row: SessionRow): Session {
  return Session.reconstitute({
    id: asSessionId(row.id),
    userId: asUserId(row.userId),
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    ipHash: row.ipHash,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  });
}

export function toAuthToken(row: AuthTokenRow): AuthToken {
  return AuthToken.reconstitute({
    id: asAuthTokenId(row.id),
    userId: asUserId(row.userId),
    purpose: row.purpose as AuthTokenPurpose,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    consumedAt: row.consumedAt,
    createdAt: row.createdAt,
  });
}

export function toLoginAttempt(row: LoginAttemptRow): LoginAttempt {
  return LoginAttempt.reconstitute({
    id: asLoginAttemptId(row.id),
    email: EmailAddress.from(row.email),
    succeeded: row.succeeded,
    createdAt: row.createdAt,
  });
}

export function toProfile(row: ProfileRow): Profile {
  return Profile.reconstitute({
    id: asProfileId(row.id),
    userId: asUserId(row.userId),
    displayName: row.displayName,
    username: Slug.from(row.username),
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    websiteUrl: row.websiteUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toCategory(row: CategoryRow): Category {
  return Category.reconstitute({
    id: asCategoryId(row.id),
    name: row.name,
    slug: Slug.from(row.slug),
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toTag(row: TagRow): Tag {
  return Tag.reconstitute({
    id: asTagId(row.id),
    name: row.name,
    slug: Slug.from(row.slug),
    createdAt: row.createdAt,
  });
}

export function toArticle(row: ArticleRow): Article {
  return Article.reconstitute({
    id: asArticleId(row.id),
    authorId: asUserId(row.authorId),
    slug: Slug.from(row.slug),
    language: row.language,
    status: row.status as ArticleStatus,
    currentVersionId: asArticleVersionId(row.currentVersionId),
    currentVersionNumber: row.currentVersionNumber,
    currentContentHash: ContentHash.from(row.currentContentHash),
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toArticleVersion(row: ArticleVersionRow): ArticleVersion {
  return ArticleVersion.reconstitute({
    id: asArticleVersionId(row.id),
    articleId: asArticleId(row.articleId),
    versionNumber: row.versionNumber,
    title: row.title,
    abstract: row.abstract,
    content: row.content,
    contentHash: ContentHash.from(row.contentHash),
    createdAt: row.createdAt,
  });
}

export function toAnalysisJob(row: AnalysisJobRow): AnalysisJob {
  return AnalysisJob.reconstitute({
    id: asAnalysisJobId(row.id),
    articleId: asArticleId(row.articleId),
    articleVersionId: asArticleVersionId(row.articleVersionId),
    status: row.status as AnalysisJobStatus,
    attemptCount: row.attemptCount,
    queuedAt: row.queuedAt,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toAnalysisMetric(row: AnalysisMetricRow): AnalysisMetric {
  return AnalysisMetric.reconstitute({
    id: asAnalysisMetricId(row.id),
    analysisRunId: asAnalysisRunId(row.analysisRunId),
    metricType: row.metricType as MetricType,
    score: scoreFromDecimal(row.score),
    confidence: scoreFromDecimal(row.confidence),
    explanation: row.explanation,
    createdAt: row.createdAt,
  });
}

export function toAnalysisEvidence(row: AnalysisEvidenceRow): AnalysisEvidence {
  return AnalysisEvidence.reconstitute({
    id: asAnalysisEvidenceId(row.id),
    analysisRunId: asAnalysisRunId(row.analysisRunId),
    metricType: row.metricType as MetricType,
    evidenceType: row.evidenceType,
    claim: row.claim,
    evidence: row.evidence,
    sourceUrl: row.sourceUrl,
    sourceTitle: row.sourceTitle,
    reliability: row.reliability === null ? null : numberFromDecimal(row.reliability),
    createdAt: row.createdAt,
  });
}

export function toSourceReference(row: SourceReferenceRow): SourceReference {
  return SourceReference.reconstitute({
    id: asSourceReferenceId(row.id),
    articleId: asArticleId(row.articleId),
    analysisRunId: asAnalysisRunId(row.analysisRunId),
    url: row.url,
    title: row.title,
    publisher: row.publisher,
    doi: row.doi,
    sourceType: row.sourceType as SourceType,
    verificationStatus: row.verificationStatus as CitationVerificationStatus,
    reliabilityScore: row.reliabilityScore === null ? null : scoreFromDecimal(row.reliabilityScore),
    createdAt: row.createdAt,
  });
}

export function toAiUsageRecord(row: AiUsageRecordRow): AiUsageRecord {
  return AiUsageRecord.reconstitute({
    id: asAiUsageRecordId(row.id),
    analysisRunId: asAnalysisRunId(row.analysisRunId),
    provider: row.provider,
    model: row.model,
    promptId: row.promptId,
    promptVersion: row.promptVersion,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    estimatedCost: numberFromDecimal(row.estimatedCost),
    latencyMs: row.latencyMs,
    recordedAt: row.recordedAt,
  });
}

export function toOperationalEvent(row: OperationalEventRow): OperationalEvent {
  return OperationalEvent.reconstitute({
    id: asOperationalEventId(row.id),
    kind: row.kind as OperationalEventKind,
    requestId: row.requestId,
    userId: row.userId ? asUserId(row.userId) : null,
    articleId: row.articleId ? asArticleId(row.articleId) : null,
    analysisRunId: row.analysisRunId ? asAnalysisRunId(row.analysisRunId) : null,
    jobId: row.jobId ? asAnalysisJobId(row.jobId) : null,
    durationMs: row.durationMs,
    status: row.status,
    message: row.message,
    createdAt: row.createdAt,
  });
}

export function toAnalysisRun(row: AnalysisRunRow): AnalysisRun {
  return AnalysisRun.reconstitute({
    id: asAnalysisRunId(row.id),
    articleId: asArticleId(row.articleId),
    articleVersionId: asArticleVersionId(row.articleVersionId),
    status: row.status as AnalysisRunStatus,
    pipelineVersion: row.pipelineVersion,
    promptVersion: row.promptVersion,
    modelProvider: row.modelProvider,
    modelName: row.modelName,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    tokenUsage: row.tokenUsage,
    estimatedCost: row.estimatedCost === null ? null : numberFromDecimal(row.estimatedCost),
    createdAt: row.createdAt,
  });
}

export function toScoreSnapshot(row: ScoreSnapshotRow): ScoreSnapshot {
  return ScoreSnapshot.reconstitute({
    id: asScoreSnapshotId(row.id),
    articleId: asArticleId(row.articleId),
    articleVersionId: asArticleVersionId(row.articleVersionId),
    analysisRunId: asAnalysisRunId(row.analysisRunId),
    qualityScore: scoreFromDecimal(row.qualityScore),
    authorshipRisk: scoreFromDecimal(row.authorshipRisk),
    authorshipConfidence: scoreFromDecimal(row.authorshipConfidence),
    authorshipIntegrity: scoreFromDecimal(row.authorshipIntegrity),
    authorshipClassification: row.authorshipClassification as AuthorshipClassification,
    overallScore: scoreFromDecimal(row.overallScore),
    scoringPolicyVersion: row.scoringPolicyVersion,
    createdAt: row.createdAt,
  });
}

export function toModerationReview(row: ModerationReviewRow): ModerationReview {
  return ModerationReview.reconstitute({
    id: asModerationReviewId(row.id),
    articleId: asArticleId(row.articleId),
    articleVersionId: asArticleVersionId(row.articleVersionId),
    moderatorId: asUserId(row.moderatorId),
    decision: row.decision as ModerationDecision,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.createdAt,
  });
}

export function toAuditLog(row: AuditLogRow): AuditLog {
  return AuditLog.reconstitute({
    id: asAuditLogId(row.id),
    actorUserId: row.actorUserId ? asUserId(row.actorUserId) : null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    ipHash: row.ipHash,
    createdAt: row.createdAt,
  });
}

export function toScoringPolicy(row: ScoringPolicyRow): ScoringPolicy {
  return ScoringPolicy.reconstitute(toScoringPolicyProps(row));
}

export function scoringPolicyCreateData(policy: ScoringPolicy, now: Date, isActive: boolean) {
  return {
    version: policy.version,
    qualityWeights: JSON.stringify(policy.qualityWeights),
    qualityWeight: decimalFromAmount(policy.qualityWeight, 8),
    authorshipIntegrityWeight: decimalFromAmount(policy.authorshipIntegrityWeight, 8),
    authorshipConfidenceThreshold: decimalFromScore(policy.authorshipConfidenceThreshold),
    authorshipClassificationThresholds: JSON.stringify({
      veryLowMax: policy.authorshipClassificationThresholds.veryLowMax.value,
      lowMax: policy.authorshipClassificationThresholds.lowMax.value,
      uncertainMax: policy.authorshipClassificationThresholds.uncertainMax.value,
      elevatedMax: policy.authorshipClassificationThresholds.elevatedMax.value,
    }),
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}

export function scoringPolicyUpdateData(policy: ScoringPolicy, now: Date, isActive: boolean) {
  const created = scoringPolicyCreateData(policy, now, isActive);
  const { createdAt: _createdAt, version: _version, ...update } = created;
  return update;
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed as Record<string, unknown>;
}

function toScoringPolicyProps(row: ScoringPolicyRow): ScoringPolicyProps {
  const weights = parseJsonObject(row.qualityWeights, 'qualityWeights');
  const thresholds = parseJsonObject(
    row.authorshipClassificationThresholds,
    'authorshipClassificationThresholds',
  );

  return {
    version: row.version,
    qualityWeights: {
      structure: asFiniteNumber(weights, 'structure'),
      contentQuality: asFiniteNumber(weights, 'contentQuality'),
      topicRelevance: asFiniteNumber(weights, 'topicRelevance'),
      citationQuality: asFiniteNumber(weights, 'citationQuality'),
      evidence: asFiniteNumber(weights, 'evidence'),
      factualReliability: asFiniteNumber(weights, 'factualReliability'),
      originality: asFiniteNumber(weights, 'originality'),
    } satisfies QualityWeights,
    qualityWeight: numberFromDecimal(row.qualityWeight),
    authorshipIntegrityWeight: numberFromDecimal(row.authorshipIntegrityWeight),
    authorshipConfidenceThreshold: scoreFromDecimal(row.authorshipConfidenceThreshold),
    authorshipClassificationThresholds: {
      veryLowMax: Score.from(asFiniteNumber(thresholds, 'veryLowMax')),
      lowMax: Score.from(asFiniteNumber(thresholds, 'lowMax')),
      uncertainMax: Score.from(asFiniteNumber(thresholds, 'uncertainMax')),
      elevatedMax: Score.from(asFiniteNumber(thresholds, 'elevatedMax')),
    },
  };
}

function asFiniteNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number`);
  }

  return value;
}
