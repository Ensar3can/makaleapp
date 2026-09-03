import {
  ArticleNotFoundError,
  ArticleStatus,
  AuditAction,
  AuditLog,
  InvalidArticleStateError,
  OPERATION_RATE_LIMITS,
  asArticleId,
  asAuditLogId,
  type ArticleRepository,
  type AuditLogRepository,
  type UserRepository,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import { ValidationError } from '../errors';
import { requireModerator } from '../moderation-access';
import type { CacheStore, Clock, IdGenerator, RateLimiter } from '../ports';
import { invalidatePublicDiscoveryCache } from '../public-cache';
import type { UseCase } from '../use-case';

const REASON_MIN = 8;

export interface FlagArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
  readonly reason: string;
  readonly notes?: string;
  readonly ipHash?: string | null;
}

export interface FlagArticleResult {
  readonly articleId: string;
  readonly status: ArticleStatus;
}

export class FlagArticleUseCase implements UseCase<FlagArticleInput, FlagArticleResult> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(input: FlagArticleInput): Promise<FlagArticleResult> {
    const moderator = await requireModerator(this.users, input.actorUserId);
    await consumeRateLimit(
      this.rateLimiter,
      'flag-user',
      moderator.id,
      OPERATION_RATE_LIMITS.flagPerUser,
    );
    const reason = input.reason.trim();

    if (reason.length < REASON_MIN) {
      throw new ValidationError('A flag reason is required');
    }

    const article = await this.articles.findById(asArticleId(input.articleId));

    if (!article || article.status === ArticleStatus.REMOVED) {
      throw new ArticleNotFoundError(input.articleId);
    }

    const flaggable =
      article.status === ArticleStatus.ANALYSIS_COMPLETED ||
      article.status === ArticleStatus.READY_FOR_PUBLICATION ||
      article.status === ArticleStatus.PUBLISHED;

    if (!flaggable) {
      throw new InvalidArticleStateError('This article cannot be sent to the review queue');
    }

    const now = this.clock.now();
    const flagged = article.requireReview(now).article;
    await this.articles.save(flagged);

    if (this.cache) {
      await invalidatePublicDiscoveryCache(this.cache, flagged.slug.value);
    }
    await this.auditLogs.save(
      AuditLog.record({
        id: asAuditLogId(this.ids.next()),
        actorUserId: moderator.id,
        action: AuditAction.ARTICLE_FLAGGED,
        entityType: 'Article',
        entityId: article.id,
        metadata: JSON.stringify({
          articleVersionId: article.currentVersionId,
          reason,
          notes: input.notes?.trim() ?? '',
          previousStatus: article.status,
        }),
        ipHash: input.ipHash ?? null,
        createdAt: now,
      }),
    );

    return { articleId: flagged.id, status: flagged.status };
  }
}
