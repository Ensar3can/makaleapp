import type { AnalysisEvidence } from './analysis-evidence';
import type { AnalysisJob } from './analysis-job';
import type { AnalysisMetric } from './analysis-metric';
import type { AnalysisRun } from './analysis-run';
import type { AiUsageRecord } from './ai-usage-record';
import type { Article } from './article';
import type { ArticleVersion } from './article-version';
import type { AuditLog } from './audit-log';
import type { AuthToken } from './auth-token';
import type { Category } from './category';
import type { ContentHash } from './content-hash';
import type { EmailAddress } from './email-address';
import type { ArticleStatus, AuthTokenPurpose } from './enums';
import type {
  AiUsageRecordId,
  AnalysisEvidenceId,
  AnalysisJobId,
  AnalysisMetricId,
  AnalysisRunId,
  ArticleId,
  ArticleVersionId,
  AuditLogId,
  AuthTokenId,
  CategoryId,
  ModerationReviewId,
  OperationalEventId,
  ProfileId,
  ScoreSnapshotId,
  SessionId,
  SourceReferenceId,
  TagId,
  UserId,
} from './ids';
import type {
  MonitoredJobQuery,
  MonitoredJobRecord,
  ObservabilityRawSnapshot,
} from './observability';
import type { OperationalEvent } from './operational-event';
import type { LoginAttempt } from './login-attempt';
import type { ModerationReview } from './moderation-review';
import type { Profile } from './profile';
import type { PublicDiscoveryCursor, PublicDiscoveryQuery } from './public-discovery';
import type { ScoreSnapshot } from './score-snapshot';
import type { ScoringPolicy } from './scoring-policy';
import type { Session } from './session';
import type { Slug } from './slug';
import type { SourceReference } from './source-reference';
import type { Tag } from './tag';
import type { User } from './user';

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface ProfileRepository {
  findById(id: ProfileId): Promise<Profile | null>;
  findByUserId(userId: UserId): Promise<Profile | null>;
  findManyByUserIds(userIds: readonly UserId[]): Promise<readonly Profile[]>;
  findByUsername(username: Slug): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}

export interface ArticleRepository {
  findById(id: ArticleId): Promise<Article | null>;
  findBySlug(slug: Slug): Promise<Article | null>;
  listByAuthorId(authorId: UserId): Promise<readonly Article[]>;
  listByStatus(status: ArticleStatus): Promise<readonly Article[]>;
  listByCurrentContentHash(hash: ContentHash): Promise<readonly Article[]>;
  save(article: Article): Promise<void>;
}

export interface ArticleVersionRepository {
  findById(id: ArticleVersionId): Promise<ArticleVersion | null>;
  findManyByIds(ids: readonly ArticleVersionId[]): Promise<readonly ArticleVersion[]>;
  listByArticleId(articleId: ArticleId): Promise<readonly ArticleVersion[]>;
  save(version: ArticleVersion): Promise<void>;
}

export interface CategoryRepository {
  findById(id: CategoryId): Promise<Category | null>;
  findBySlug(slug: Slug): Promise<Category | null>;
  findManyByIds(ids: readonly CategoryId[]): Promise<readonly Category[]>;
  listActive(): Promise<readonly Category[]>;
  save(category: Category): Promise<void>;
}

export interface TagRepository {
  findById(id: TagId): Promise<Tag | null>;
  findBySlug(slug: Slug): Promise<Tag | null>;
  findManyByIds(ids: readonly TagId[]): Promise<readonly Tag[]>;
  save(tag: Tag): Promise<void>;
}

export interface ArticleTaxonomyLinks {
  readonly articleId: ArticleId;
  readonly categoryIds: readonly CategoryId[];
  readonly tagIds: readonly TagId[];
}

export interface ArticleTaxonomyRepository {
  replaceCategories(articleId: ArticleId, categoryIds: readonly CategoryId[]): Promise<void>;
  replaceTags(articleId: ArticleId, tagIds: readonly TagId[]): Promise<void>;
  listCategoryIds(articleId: ArticleId): Promise<readonly CategoryId[]>;
  listTagIds(articleId: ArticleId): Promise<readonly TagId[]>;
  listLinksByArticleIds(articleIds: readonly ArticleId[]): Promise<readonly ArticleTaxonomyLinks[]>;
}

export interface AnalysisJobRepository {
  findById(id: AnalysisJobId): Promise<AnalysisJob | null>;
  findActiveByArticleVersionId(articleVersionId: ArticleVersionId): Promise<AnalysisJob | null>;
  findDueQueued(now: Date, limit: number): Promise<readonly AnalysisJob[]>;
  save(job: AnalysisJob): Promise<void>;
  saveIfStatus(job: AnalysisJob, expectedStatus: AnalysisJob['status']): Promise<boolean>;
}

export interface AnalysisRunRepository {
  findById(id: AnalysisRunId): Promise<AnalysisRun | null>;
  listByArticleVersionId(articleVersionId: ArticleVersionId): Promise<readonly AnalysisRun[]>;
  listByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly AnalysisRun[]>;
  save(run: AnalysisRun): Promise<void>;
}

export interface AnalysisMetricRepository {
  findById(id: AnalysisMetricId): Promise<AnalysisMetric | null>;
  listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AnalysisMetric[]>;
  saveMany(metrics: readonly AnalysisMetric[]): Promise<void>;
}

export interface AnalysisEvidenceRepository {
  findById(id: AnalysisEvidenceId): Promise<AnalysisEvidence | null>;
  listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AnalysisEvidence[]>;
  listByAnalysisRunIds(analysisRunIds: readonly AnalysisRunId[]): Promise<readonly AnalysisEvidence[]>;
  saveMany(evidence: readonly AnalysisEvidence[]): Promise<void>;
}

export interface SourceReferenceRepository {
  findById(id: SourceReferenceId): Promise<SourceReference | null>;
  listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly SourceReference[]>;
  saveMany(sources: readonly SourceReference[]): Promise<void>;
}

export interface ScoreSnapshotRepository {
  findById(id: ScoreSnapshotId): Promise<ScoreSnapshot | null>;
  findLatestByArticleVersionId(articleVersionId: ArticleVersionId): Promise<ScoreSnapshot | null>;
  findLatestByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly ScoreSnapshot[]>;
  findByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<ScoreSnapshot | null>;
  save(snapshot: ScoreSnapshot): Promise<void>;
}

export interface PublicDiscoveryRecord {
  readonly article: Article;
  readonly version: ArticleVersion;
  readonly snapshot: ScoreSnapshot;
  readonly author: Profile;
  readonly categories: readonly Category[];
  readonly tags: readonly Tag[];
  readonly wordCount: number;
}

export interface PublicDiscoveryPage {
  readonly items: readonly PublicDiscoveryRecord[];
  readonly nextCursor: PublicDiscoveryCursor | null;
}

export interface PublicSitemapEntry {
  readonly slug: string;
  readonly publishedAt: Date;
  readonly updatedAt: Date;
}

export interface PublicArticleDiscoveryRepository {
  search(query: PublicDiscoveryQuery): Promise<PublicDiscoveryPage>;
  findPublishedBySlug(slug: Slug): Promise<PublicDiscoveryRecord | null>;
  listPublishedIndex(limit: number): Promise<readonly PublicSitemapEntry[]>;
}

export interface ScoringPolicyRepository {
  findByVersion(version: string): Promise<ScoringPolicy | null>;
  findActive(): Promise<ScoringPolicy | null>;
  save(policy: ScoringPolicy): Promise<void>;
}

export interface SessionRepository {
  findById(id: SessionId): Promise<Session | null>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
  revokeAllForUser(userId: UserId, now: Date): Promise<void>;
}

export interface AuthTokenRepository {
  findById(id: AuthTokenId): Promise<AuthToken | null>;
  findByTokenHash(tokenHash: string): Promise<AuthToken | null>;
  save(token: AuthToken): Promise<void>;
  consumeUnconsumed(userId: UserId, purpose: AuthTokenPurpose, now: Date): Promise<void>;
}

export interface LoginAttemptRepository {
  record(attempt: LoginAttempt): Promise<void>;
  listRecentByEmail(email: EmailAddress, since: Date): Promise<readonly LoginAttempt[]>;
}

export interface ModerationReviewRepository {
  findById(id: ModerationReviewId): Promise<ModerationReview | null>;
  listByArticleId(articleId: ArticleId): Promise<readonly ModerationReview[]>;
  save(review: ModerationReview): Promise<void>;
}

export interface AuditLogRepository {
  findById(id: AuditLogId): Promise<AuditLog | null>;
  listByEntity(entityType: string, entityId: string): Promise<readonly AuditLog[]>;
  save(entry: AuditLog): Promise<void>;
}

export interface AiUsageRecordRepository {
  findById(id: AiUsageRecordId): Promise<AiUsageRecord | null>;
  listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AiUsageRecord[]>;
  saveMany(records: readonly AiUsageRecord[]): Promise<void>;
}

export interface OperationalEventRepository {
  findById(id: OperationalEventId): Promise<OperationalEvent | null>;
  listRecent(limit: number): Promise<readonly OperationalEvent[]>;
  save(event: OperationalEvent): Promise<void>;
}

export interface ObservabilityRepository {
  loadDashboard(now: Date): Promise<ObservabilityRawSnapshot>;
  listJobs(query: MonitoredJobQuery): Promise<readonly MonitoredJobRecord[]>;
  recordHeartbeat(component: string, now: Date): Promise<void>;
}
