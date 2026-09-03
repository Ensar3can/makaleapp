import {
  AnalysisJobStatus,
  ArticleStatus,
  AuthTokenPurpose,
  compareDiscoveryRecords,
  createDiscoveryCursor,
  discoveryCursorComesAfter,
  analysisDurationMs,
  startOfUtcDay,
  startOfUtcMonth,
  type AiUsageRecord,
  type AiUsageRecordId,
  type AnalysisEvidence,
  type AnalysisEvidenceId,
  type AnalysisJob,
  type AnalysisMetric,
  type AnalysisMetricId,
  type AnalysisRun,
  type AnalysisRunId,
  type Article,
  type ArticleId,
  type ArticleTaxonomyRepository,
  type ArticleVersion,
  type ArticleVersionId,
  type AuditLog,
  type AuditLogId,
  type AuthToken,
  type AuthTokenRepository,
  type Category,
  type CategoryId,
  type CategoryRepository,
  type ContentHash,
  type EmailAddress,
  type LoginAttempt,
  type LoginAttemptRepository,
  type ModerationReview,
  type ModerationReviewId,
  type ModerationReviewRepository,
  type Profile,
  type ProfileRepository,
  type PublicArticleDiscoveryRepository,
  type PublicDiscoveryPage,
  type PublicDiscoveryQuery,
  type PublicDiscoveryRecord,
  type PublicSitemapEntry,
  type Session,
  type SessionRepository,
  type Slug,
  type Tag,
  type TagId,
  type TagRepository,
  type User,
  type UserId,
  type UserRepository,
  countWords,
  OperationalEventKind,
  type AiUsageRecordRepository,
  type AnalysisEvidenceRepository,
  type AnalysisJobRepository,
  type ObservabilityRepository,
  type OperationalEvent,
  type OperationalEventId,
  type OperationalEventRepository,
  type ObservabilityRawSnapshot,
  type ObservabilityStageCost,
  type MonitoredJobQuery,
  type MonitoredJobRecord,
  type AnalysisMetricRepository,
  type AnalysisRunRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type AuditLogRepository,
  type ScoreSnapshot,
  type ScoreSnapshotId,
  type ScoreSnapshotRepository,
  type ScoringPolicy,
  type ScoringPolicyRepository,
  type SourceReference,
  type SourceReferenceId,
  type SourceReferenceRepository,
} from '@aip/domain';
import type {
  CacheStore,
  Clock,
  EmailMessage,
  EmailSender,
  IdGenerator,
  PasswordHasher,
  RateLimitDecision,
  RateLimiter,
  TokenDigest,
  TokenGenerator,
} from './ports';

export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, { value: string; expiresAt: number }>();

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.entries.get(key);

    if (!entry || entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    return JSON.parse(entry.value) as T;
  }

  public async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    this.entries.set(key, { value: JSON.stringify(value), expiresAt: Date.now() + ttlMs });
  }

  public async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }

  public async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) {
        this.entries.delete(key);
      }
    }
  }
}

export class FixedClock implements Clock {
  public constructor(private current: Date) {}

  public now(): Date {
    return this.current;
  }

  public advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export class SequentialIdGenerator implements IdGenerator {
  private n = 0;

  public next(): string {
    this.n += 1;
    return `00000000-0000-4000-8000-${this.n.toString().padStart(12, '0')}`;
  }
}

export class FakePasswordHasher implements PasswordHasher {
  public async hash(password: string): Promise<string> {
    return `fake:${password}`;
  }

  public async verify(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `fake:${password}`;
  }
}

export class FakeTokenDigest implements TokenDigest {
  public hash(token: string): string {
    let hex = '';

    for (const character of `digest:${token}`) {
      hex += character.charCodeAt(0).toString(16).padStart(2, '0');
    }

    return hex.padEnd(64, '0').slice(0, 64);
  }
}

export class SequentialTokenGenerator implements TokenGenerator {
  private n = 0;

  public next(): string {
    this.n += 1;
    return `token-${this.n}`;
  }
}

export class MemoryEmailSender implements EmailSender {
  public readonly messages: EmailMessage[] = [];

  public async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  public async consume(key: string, limit: number, windowMs: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const existing = this.buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, retryAfterMs: windowMs };
    }

    existing.count += 1;

    if (existing.count > limit) {
      return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, existing.resetAt - now) };
    }

    return { allowed: true, remaining: limit - existing.count, retryAfterMs: existing.resetAt - now };
  }

  public reset(): void {
    this.buckets.clear();
  }
}

export class InMemoryUserRepository implements UserRepository {
  private readonly byId = new Map<string, User>();

  public async findById(id: User['id']): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  public async findByEmail(email: EmailAddress): Promise<User | null> {
    return [...this.byId.values()].find((user) => user.email.equals(email)) ?? null;
  }

  public async save(user: User): Promise<void> {
    this.byId.set(user.id, user);
  }
}

export class InMemoryProfileRepository implements ProfileRepository {
  private readonly byId = new Map<string, Profile>();

  public async findById(id: Profile['id']): Promise<Profile | null> {
    return this.byId.get(id) ?? null;
  }

  public async findByUserId(userId: UserId): Promise<Profile | null> {
    return [...this.byId.values()].find((profile) => profile.userId === userId) ?? null;
  }

  public async findManyByUserIds(userIds: readonly UserId[]): Promise<readonly Profile[]> {
    const wanted = new Set(userIds);
    return [...this.byId.values()].filter((profile) => wanted.has(profile.userId));
  }

  public async findByUsername(username: Slug): Promise<Profile | null> {
    return [...this.byId.values()].find((profile) => profile.username.equals(username)) ?? null;
  }

  public async save(profile: Profile): Promise<void> {
    this.byId.set(profile.id, profile);
  }
}

export class InMemorySessionRepository implements SessionRepository {
  private readonly byId = new Map<string, Session>();

  public async findById(id: Session['id']): Promise<Session | null> {
    return this.byId.get(id) ?? null;
  }

  public async findByTokenHash(tokenHash: string): Promise<Session | null> {
    return [...this.byId.values()].find((session) => session.tokenHash === tokenHash) ?? null;
  }

  public async save(session: Session): Promise<void> {
    this.byId.set(session.id, session);
  }

  public async revokeAllForUser(userId: UserId, now: Date): Promise<void> {
    for (const session of this.byId.values()) {
      if (session.userId === userId) {
        this.byId.set(session.id, session.revoke(now));
      }
    }
  }
}

export class InMemoryAuthTokenRepository implements AuthTokenRepository {
  private readonly byId = new Map<string, AuthToken>();

  public async findById(id: AuthToken['id']): Promise<AuthToken | null> {
    return this.byId.get(id) ?? null;
  }

  public async findByTokenHash(tokenHash: string): Promise<AuthToken | null> {
    return [...this.byId.values()].find((token) => token.tokenHash === tokenHash) ?? null;
  }

  public async save(token: AuthToken): Promise<void> {
    this.byId.set(token.id, token);
  }

  public async consumeUnconsumed(userId: UserId, purpose: AuthTokenPurpose, now: Date): Promise<void> {
    for (const token of this.byId.values()) {
      if (token.userId === userId && token.purpose === purpose && token.isUsable(now)) {
        this.byId.set(token.id, token.consume(now));
      }
    }
  }
}

export class InMemoryLoginAttemptRepository implements LoginAttemptRepository {
  public readonly attempts: LoginAttempt[] = [];

  public async record(attempt: LoginAttempt): Promise<void> {
    this.attempts.push(attempt);
  }

  public async listRecentByEmail(email: EmailAddress, since: Date): Promise<readonly LoginAttempt[]> {
    return this.attempts.filter(
      (attempt) => attempt.email.equals(email) && attempt.createdAt.getTime() >= since.getTime(),
    );
  }
}

export class InMemoryArticleRepository implements ArticleRepository {
  private readonly byId = new Map<string, Article>();

  public async findById(id: Article['id']): Promise<Article | null> {
    return this.byId.get(id) ?? null;
  }

  public async findBySlug(slug: Slug): Promise<Article | null> {
    return [...this.byId.values()].find((article) => article.slug.equals(slug)) ?? null;
  }

  public async listByAuthorId(authorId: UserId): Promise<readonly Article[]> {
    return [...this.byId.values()]
      .filter((article) => article.authorId === authorId && article.status !== ArticleStatus.REMOVED)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }

  public async listByStatus(status: ArticleStatus): Promise<readonly Article[]> {
    return [...this.byId.values()]
      .filter((article) => article.status === status)
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());
  }

  public async listByCurrentContentHash(hash: ContentHash): Promise<readonly Article[]> {
    return [...this.byId.values()].filter(
      (article) => article.currentContentHash.equals(hash) && article.status !== ArticleStatus.REMOVED,
    );
  }

  public async listAll(): Promise<readonly Article[]> {
    return [...this.byId.values()];
  }

  public async save(article: Article): Promise<void> {
    this.byId.set(article.id, article);
  }
}

export class InMemoryArticleVersionRepository implements ArticleVersionRepository {
  private readonly byId = new Map<string, ArticleVersion>();

  public async findById(id: ArticleVersion['id']): Promise<ArticleVersion | null> {
    return this.byId.get(id) ?? null;
  }

  public async findManyByIds(ids: readonly ArticleVersionId[]): Promise<readonly ArticleVersion[]> {
    return ids.flatMap((id) => {
      const version = this.byId.get(id);
      return version ? [version] : [];
    });
  }

  public async listByArticleId(articleId: Article['id']): Promise<readonly ArticleVersion[]> {
    return [...this.byId.values()]
      .filter((version) => version.articleId === articleId)
      .sort((left, right) => left.versionNumber - right.versionNumber);
  }

  public async save(version: ArticleVersion): Promise<void> {
    this.byId.set(version.id, version);
  }
}

export class InMemoryCategoryRepository implements CategoryRepository {
  private readonly byId = new Map<string, Category>();

  public async findById(id: Category['id']): Promise<Category | null> {
    return this.byId.get(id) ?? null;
  }

  public async findBySlug(slug: Slug): Promise<Category | null> {
    return [...this.byId.values()].find((category) => category.slug.equals(slug)) ?? null;
  }

  public async findManyByIds(ids: readonly CategoryId[]): Promise<readonly Category[]> {
    return ids.flatMap((id) => {
      const category = this.byId.get(id);
      return category ? [category] : [];
    });
  }

  public async listActive(): Promise<readonly Category[]> {
    return [...this.byId.values()]
      .filter((category) => category.isActive)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  public async save(category: Category): Promise<void> {
    this.byId.set(category.id, category);
  }
}

export class InMemoryTagRepository implements TagRepository {
  private readonly byId = new Map<string, Tag>();

  public async findById(id: Tag['id']): Promise<Tag | null> {
    return this.byId.get(id) ?? null;
  }

  public async findBySlug(slug: Slug): Promise<Tag | null> {
    return [...this.byId.values()].find((tag) => tag.slug.equals(slug)) ?? null;
  }

  public async findManyByIds(ids: readonly TagId[]): Promise<readonly Tag[]> {
    return ids.flatMap((id) => {
      const tag = this.byId.get(id);
      return tag ? [tag] : [];
    });
  }

  public async save(tag: Tag): Promise<void> {
    this.byId.set(tag.id, tag);
  }
}

export class InMemoryArticleTaxonomyRepository implements ArticleTaxonomyRepository {
  private readonly categories = new Map<string, readonly string[]>();
  private readonly tags = new Map<string, readonly string[]>();

  public async replaceCategories(articleId: ArticleId, categoryIds: readonly CategoryId[]): Promise<void> {
    this.categories.set(articleId, [...categoryIds]);
  }

  public async replaceTags(articleId: ArticleId, tagIds: readonly TagId[]): Promise<void> {
    this.tags.set(articleId, [...tagIds]);
  }

  public async listCategoryIds(articleId: ArticleId): Promise<readonly CategoryId[]> {
    return (this.categories.get(articleId) ?? []) as readonly CategoryId[];
  }

  public async listTagIds(articleId: ArticleId): Promise<readonly TagId[]> {
    return (this.tags.get(articleId) ?? []) as readonly TagId[];
  }

  public async listLinksByArticleIds(articleIds: readonly ArticleId[]) {
    return articleIds.map((articleId) => ({
      articleId,
      categoryIds: (this.categories.get(articleId) ?? []) as readonly CategoryId[],
      tagIds: (this.tags.get(articleId) ?? []) as readonly TagId[],
    }));
  }
}

export class InMemoryAnalysisJobRepository implements AnalysisJobRepository {
  private readonly byId = new Map<string, AnalysisJob>();

  public async findById(id: AnalysisJob['id']): Promise<AnalysisJob | null> {
    return this.byId.get(id) ?? null;
  }

  public async findActiveByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<AnalysisJob | null> {
    return (
      [...this.byId.values()].find(
        (job) =>
          job.articleVersionId === articleVersionId &&
          (job.status === AnalysisJobStatus.QUEUED || job.status === AnalysisJobStatus.RUNNING),
      ) ?? null
    );
  }

  public async findDueQueued(now: Date, limit: number): Promise<readonly AnalysisJob[]> {
    return [...this.byId.values()]
      .filter((job) => job.status === AnalysisJobStatus.QUEUED && job.queuedAt.getTime() <= now.getTime())
      .sort((left, right) => left.queuedAt.getTime() - right.queuedAt.getTime())
      .slice(0, limit);
  }

  public async save(job: AnalysisJob): Promise<void> {
    this.byId.set(job.id, job);
  }

  public async saveIfStatus(job: AnalysisJob, expectedStatus: AnalysisJobStatus): Promise<boolean> {
    const current = this.byId.get(job.id);

    if (!current || current.status !== expectedStatus) {
      return false;
    }

    this.byId.set(job.id, job);
    return true;
  }

  public listAll(): readonly AnalysisJob[] {
    return [...this.byId.values()];
  }
}

export class InMemoryAnalysisRunRepository implements AnalysisRunRepository {
  private readonly byId = new Map<string, AnalysisRun>();

  public async findById(id: AnalysisRunId): Promise<AnalysisRun | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<readonly AnalysisRun[]> {
    return [...this.byId.values()]
      .filter((run) => run.articleVersionId === articleVersionId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async listByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly AnalysisRun[]> {
    const wanted = new Set(articleVersionIds);
    return [...this.byId.values()]
      .filter((run) => wanted.has(run.articleVersionId))
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async save(run: AnalysisRun): Promise<void> {
    this.byId.set(run.id, run);
  }

  public listAll(): readonly AnalysisRun[] {
    return [...this.byId.values()];
  }
}

export class InMemoryAnalysisMetricRepository implements AnalysisMetricRepository {
  private readonly byId = new Map<string, AnalysisMetric>();

  public async findById(id: AnalysisMetricId): Promise<AnalysisMetric | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AnalysisMetric[]> {
    return [...this.byId.values()]
      .filter((metric) => metric.analysisRunId === analysisRunId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async saveMany(metrics: readonly AnalysisMetric[]): Promise<void> {
    for (const metric of metrics) {
      this.byId.set(metric.id, metric);
    }
  }
}

export class InMemoryAnalysisEvidenceRepository implements AnalysisEvidenceRepository {
  private readonly byId = new Map<string, AnalysisEvidence>();

  public async findById(id: AnalysisEvidenceId): Promise<AnalysisEvidence | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByAnalysisRunId(
    analysisRunId: AnalysisRunId,
  ): Promise<readonly AnalysisEvidence[]> {
    return [...this.byId.values()]
      .filter((item) => item.analysisRunId === analysisRunId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async listByAnalysisRunIds(
    analysisRunIds: readonly AnalysisRunId[],
  ): Promise<readonly AnalysisEvidence[]> {
    const wanted = new Set(analysisRunIds);
    return [...this.byId.values()]
      .filter((item) => wanted.has(item.analysisRunId))
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async saveMany(evidence: readonly AnalysisEvidence[]): Promise<void> {
    for (const item of evidence) {
      this.byId.set(item.id, item);
    }
  }
}

export class InMemorySourceReferenceRepository implements SourceReferenceRepository {
  private readonly byId = new Map<string, SourceReference>();

  public async findById(id: SourceReferenceId): Promise<SourceReference | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByAnalysisRunId(
    analysisRunId: AnalysisRunId,
  ): Promise<readonly SourceReference[]> {
    return [...this.byId.values()]
      .filter((item) => item.analysisRunId === analysisRunId)
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
  }

  public async saveMany(sources: readonly SourceReference[]): Promise<void> {
    for (const source of sources) {
      this.byId.set(source.id, source);
    }
  }
}

export class InMemoryScoreSnapshotRepository implements ScoreSnapshotRepository {
  private readonly byId = new Map<string, ScoreSnapshot>();

  public async findById(id: ScoreSnapshotId): Promise<ScoreSnapshot | null> {
    return this.byId.get(id) ?? null;
  }

  public async findLatestByArticleVersionId(
    articleVersionId: ArticleVersionId,
  ): Promise<ScoreSnapshot | null> {
    return (
      [...this.byId.values()]
        .filter((snapshot) => snapshot.articleVersionId === articleVersionId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null
    );
  }

  public async findLatestByArticleVersionIds(
    articleVersionIds: readonly ArticleVersionId[],
  ): Promise<readonly ScoreSnapshot[]> {
    const latest = new Map<string, ScoreSnapshot>();

    for (const snapshot of this.byId.values()) {
      if (!articleVersionIds.includes(snapshot.articleVersionId)) {
        continue;
      }

      const current = latest.get(snapshot.articleVersionId);

      if (!current || snapshot.createdAt.getTime() > current.createdAt.getTime()) {
        latest.set(snapshot.articleVersionId, snapshot);
      }
    }

    return [...latest.values()];
  }

  public async findByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<ScoreSnapshot | null> {
    return [...this.byId.values()].find((snapshot) => snapshot.analysisRunId === analysisRunId) ?? null;
  }

  public async save(snapshot: ScoreSnapshot): Promise<void> {
    this.byId.set(snapshot.id, snapshot);
  }
}

export class InMemoryScoringPolicyRepository implements ScoringPolicyRepository {
  private activeVersion: string | null = null;
  private readonly byVersion = new Map<string, ScoringPolicy>();

  public constructor(policy?: ScoringPolicy) {
    if (policy) {
      this.byVersion.set(policy.version, policy);
      this.activeVersion = policy.version;
    }
  }

  public async findByVersion(version: string): Promise<ScoringPolicy | null> {
    return this.byVersion.get(version) ?? null;
  }

  public async findActive(): Promise<ScoringPolicy | null> {
    return this.activeVersion ? (this.byVersion.get(this.activeVersion) ?? null) : null;
  }

  public async save(policy: ScoringPolicy): Promise<void> {
    this.byVersion.set(policy.version, policy);
    this.activeVersion = policy.version;
  }
}

export class InMemoryModerationReviewRepository implements ModerationReviewRepository {
  private readonly byId = new Map<string, ModerationReview>();

  public async findById(id: ModerationReviewId): Promise<ModerationReview | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByArticleId(articleId: ArticleId): Promise<readonly ModerationReview[]> {
    return [...this.byId.values()]
      .filter((review) => review.articleId === articleId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  public async save(review: ModerationReview): Promise<void> {
    this.byId.set(review.id, review);
  }
}

export class InMemoryAiUsageRecordRepository implements AiUsageRecordRepository {
  private readonly byId = new Map<string, AiUsageRecord>();

  public async findById(id: AiUsageRecordId): Promise<AiUsageRecord | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByAnalysisRunId(analysisRunId: AnalysisRunId): Promise<readonly AiUsageRecord[]> {
    return [...this.byId.values()]
      .filter((record) => record.analysisRunId === analysisRunId)
      .sort((left, right) => left.recordedAt.getTime() - right.recordedAt.getTime());
  }

  public async saveMany(records: readonly AiUsageRecord[]): Promise<void> {
    for (const record of records) {
      this.byId.set(record.id, record);
    }
  }

  public listAll(): readonly AiUsageRecord[] {
    return [...this.byId.values()];
  }
}

export class InMemoryOperationalEventRepository implements OperationalEventRepository {
  private readonly byId = new Map<string, OperationalEvent>();

  public async findById(id: OperationalEventId): Promise<OperationalEvent | null> {
    return this.byId.get(id) ?? null;
  }

  public async listRecent(limit: number): Promise<readonly OperationalEvent[]> {
    return [...this.byId.values()]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  }

  public async save(event: OperationalEvent): Promise<void> {
    this.byId.set(event.id, event);
  }
}

export class InMemoryObservabilityRepository implements ObservabilityRepository {
  public heartbeatAt: Date | null = null;

  public constructor(
    private readonly jobs: InMemoryAnalysisJobRepository,
    private readonly runs: InMemoryAnalysisRunRepository,
    private readonly articles: InMemoryArticleRepository,
    private readonly versions: InMemoryArticleVersionRepository,
    private readonly usage: InMemoryAiUsageRecordRepository,
    private readonly events: InMemoryOperationalEventRepository,
  ) {}

  public async loadDashboard(now: Date): Promise<ObservabilityRawSnapshot> {
    const jobs = this.jobs.listAll();
    const runs = this.runs.listAll();
    const today = startOfUtcDay(now);
    const month = startOfUtcMonth(now);
    const completedJobs = jobs.filter((job) => job.status === AnalysisJobStatus.COMPLETED);
    const completedRuns = runs.filter((run) => run.status === 'COMPLETED');
    const failedRuns = runs.filter((run) => run.status === 'FAILED');
    const stageCosts = new Map<string, ObservabilityStageCost>();

    for (const record of this.usage.listAll()) {
      const current = stageCosts.get(record.promptId) ?? {
        promptId: record.promptId,
        totalCost: 0,
        callCount: 0,
      };
      stageCosts.set(record.promptId, {
        promptId: record.promptId,
        totalCost: current.totalCost + record.estimatedCost,
        callCount: current.callCount + 1,
      });
    }

    return {
      jobsQueued: jobs.filter((job) => job.status === AnalysisJobStatus.QUEUED).length,
      jobsRunning: jobs.filter((job) => job.status === AnalysisJobStatus.RUNNING).length,
      jobsFailed: jobs.filter((job) => job.status === AnalysisJobStatus.FAILED).length,
      jobsCompleted: completedJobs.length,
      completedDurationsMs: completedJobs.flatMap((job) => {
        const duration = analysisDurationMs(job.startedAt, job.completedAt);
        return duration === null ? [] : [duration];
      }),
      completedRunCount: completedRuns.length,
      failedRunCount: failedRuns.length,
      tokenUsageSum: completedRuns.reduce((sum, run) => sum + (run.tokenUsage ?? 0), 0),
      tokenUsageCount: completedRuns.filter((run) => run.tokenUsage !== null).length,
      costToday: completedRuns
        .filter((run) => run.createdAt.getTime() >= today.getTime())
        .reduce((sum, run) => sum + (run.estimatedCost ?? 0), 0),
      costThisMonth: completedRuns
        .filter((run) => run.createdAt.getTime() >= month.getTime())
        .reduce((sum, run) => sum + (run.estimatedCost ?? 0), 0),
      costCompletedSum: completedRuns.reduce((sum, run) => sum + (run.estimatedCost ?? 0), 0),
      costCompletedCount: completedRuns.filter((run) => run.estimatedCost !== null).length,
      articlesRequiringReview: (await this.articles.listByStatus(ArticleStatus.REQUIRES_REVIEW)).length,
      aiProviderFailureCount: (await this.events.listRecent(1000)).filter(
        (event) => event.kind === OperationalEventKind.AI_PROVIDER_FAILURE,
      ).length,
      expensiveStages: [...stageCosts.values()].sort((left, right) => right.totalCost - left.totalCost),
      recentErrors: await this.events.listRecent(20),
      workerHeartbeatAt: this.heartbeatAt,
    };
  }

  public async listJobs(query: MonitoredJobQuery): Promise<readonly MonitoredJobRecord[]> {
    const jobs = this.jobs
      .listAll()
      .filter((job) => (query.status ? job.status === query.status : true))
      .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
      .slice(0, query.limit);
    const records: MonitoredJobRecord[] = [];

    for (const job of jobs) {
      const version = await this.versions.findById(job.articleVersionId);
      const runs = await this.runs.listByArticleVersionId(job.articleVersionId);
      records.push({
        job,
        title: version?.title ?? 'Untitled',
        run: [...runs].reverse()[0] ?? null,
      });
    }

    return records;
  }

  public async recordHeartbeat(_component: string, now: Date): Promise<void> {
    this.heartbeatAt = now;
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private readonly byId = new Map<string, AuditLog>();

  public async findById(id: AuditLogId): Promise<AuditLog | null> {
    return this.byId.get(id) ?? null;
  }

  public async listByEntity(entityType: string, entityId: string): Promise<readonly AuditLog[]> {
    return [...this.byId.values()]
      .filter((entry) => entry.entityType === entityType && entry.entityId === entityId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
  }

  public async save(entry: AuditLog): Promise<void> {
    this.byId.set(entry.id, entry);
  }
}

export class InMemoryPublicArticleDiscoveryRepository implements PublicArticleDiscoveryRepository {
  public constructor(
    private readonly articles: InMemoryArticleRepository,
    private readonly versions: InMemoryArticleVersionRepository,
    private readonly snapshots: InMemoryScoreSnapshotRepository,
    private readonly profiles: InMemoryProfileRepository,
    private readonly categories: InMemoryCategoryRepository,
    private readonly tags: InMemoryTagRepository,
    private readonly taxonomy: InMemoryArticleTaxonomyRepository,
  ) {}

  public async search(query: PublicDiscoveryQuery): Promise<PublicDiscoveryPage> {
    const records = await this.collectPublished();
    const filtered = records.filter((record) => matchesDiscoveryQuery(record, query));
    const sorted = [...filtered].sort((left, right) =>
      compareDiscoveryRecords(query.sort, discoverySortKey(left), discoverySortKey(right)),
    );
    const cursor = query.cursor;
    const afterCursor = cursor
      ? sorted.filter((record) => discoveryCursorComesAfter(query.sort, cursor, discoverySortKey(record)))
      : sorted;
    const pageItems = afterCursor.slice(0, query.limit);
    const last = pageItems.at(-1);
    const nextCursor =
      afterCursor.length > query.limit && last
        ? createDiscoveryCursor({
            sort: query.sort,
            overallScore: last.snapshot.overallScore,
            publishedAt: last.article.publishedAt!,
            articleId: last.article.id,
          })
        : null;

    return { items: pageItems, nextCursor };
  }

  public async findPublishedBySlug(slug: Slug): Promise<PublicDiscoveryRecord | null> {
    const records = await this.collectPublished();
    return records.find((record) => record.article.slug.equals(slug)) ?? null;
  }

  public async listPublishedIndex(limit: number): Promise<readonly PublicSitemapEntry[]> {
    const records = await this.collectPublished();
    return [...records]
      .sort((left, right) => right.article.publishedAt!.getTime() - left.article.publishedAt!.getTime())
      .slice(0, limit)
      .map((record) => ({
        slug: record.article.slug.value,
        publishedAt: record.article.publishedAt!,
        updatedAt: record.article.updatedAt,
      }));
  }

  private async collectPublished(): Promise<PublicDiscoveryRecord[]> {
    const articles = await this.articles.listAll();
    const records: PublicDiscoveryRecord[] = [];

    for (const article of articles) {
      if (article.status !== ArticleStatus.PUBLISHED || !article.publishedAt) {
        continue;
      }

      const [version, snapshot, author] = await Promise.all([
        this.versions.findById(article.currentVersionId),
        this.snapshots.findLatestByArticleVersionId(article.currentVersionId),
        this.profiles.findByUserId(article.authorId),
      ]);

      if (!version || !snapshot?.isBoundTo(article.currentVersionId) || !author) {
        continue;
      }

      const [categoryIds, tagIds] = await Promise.all([
        this.taxonomy.listCategoryIds(article.id),
        this.taxonomy.listTagIds(article.id),
      ]);
      const [categories, tags] = await Promise.all([
        this.categories.findManyByIds(categoryIds),
        this.tags.findManyByIds(tagIds),
      ]);

      records.push({
        article,
        version,
        snapshot,
        author,
        categories,
        tags,
        wordCount: countWords(version.content),
      });
    }

    return records;
  }
}

function discoverySortKey(record: PublicDiscoveryRecord) {
  return {
    overallScore: record.snapshot.overallScore,
    publishedAt: record.article.publishedAt!,
    articleId: record.article.id,
  };
}

function matchesDiscoveryQuery(record: PublicDiscoveryRecord, query: PublicDiscoveryQuery): boolean {
  if (query.excludeArticleId && record.article.id === query.excludeArticleId) {
    return false;
  }

  if (query.language && record.article.language !== query.language) {
    return false;
  }

  if (query.authorUsername && record.author.username.value !== query.authorUsername) {
    return false;
  }

  if (query.categorySlug && !record.categories.some((category) => category.slug.value === query.categorySlug)) {
    return false;
  }

  if (query.tagSlug && !record.tags.some((tag) => tag.slug.value === query.tagSlug)) {
    return false;
  }

  if (query.minOverallScore && record.snapshot.overallScore.value < query.minOverallScore.value) {
    return false;
  }

  if (query.maxOverallScore && record.snapshot.overallScore.value > query.maxOverallScore.value) {
    return false;
  }

  if (query.searchTokens.length > 0) {
    const haystack = `${record.version.title} ${record.version.abstract}`.toLowerCase();
    if (!query.searchTokens.every((token) => haystack.includes(token))) {
      return false;
    }
  }

  return true;
}
