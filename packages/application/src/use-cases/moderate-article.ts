import {
  ArticleNotFoundError,
  ArticleStatus,
  AuditAction,
  AuditLog,
  InvalidArticleStateError,
  ModerationDecision,
  ModerationReview,
  OPERATION_RATE_LIMITS,
  asArticleId,
  asAuditLogId,
  asModerationReviewId,
  isModerationDecision,
  type ArticleRepository,
  type AuditLogRepository,
  type ModerationReviewRepository,
  type UserRepository,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import { ValidationError } from '../errors';
import { requireModerator } from '../moderation-access';
import {
  toModerationReviewView,
  type ModerationReviewView,
} from '../moderation-views';
import type { CacheStore, Clock, IdGenerator, RateLimiter } from '../ports';
import { invalidatePublicDiscoveryCache } from '../public-cache';
import type { UseCase } from '../use-case';

export interface ModerateArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
  readonly decision: string;
  readonly reason: string;
  readonly notes?: string;
  readonly ipHash?: string | null;
}

export interface ModerateArticleResult {
  readonly articleId: string;
  readonly status: ArticleStatus;
  readonly review: ModerationReviewView;
}

export class ModerateArticleUseCase implements UseCase<ModerateArticleInput, ModerateArticleResult> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly reviews: ModerationReviewRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(input: ModerateArticleInput): Promise<ModerateArticleResult> {
    const moderator = await requireModerator(this.users, input.actorUserId);
    await consumeRateLimit(
      this.rateLimiter,
      'moderate-user',
      moderator.id,
      OPERATION_RATE_LIMITS.moderatePerUser,
    );

    if (!isModerationDecision(input.decision)) {
      throw new ValidationError('Moderation decision must be APPROVE, REQUEST_REVISION, or REJECT');
    }

    const article = await this.articles.findById(asArticleId(input.articleId));

    if (!article || article.status === ArticleStatus.REMOVED) {
      throw new ArticleNotFoundError(input.articleId);
    }

    if (article.status !== ArticleStatus.REQUIRES_REVIEW) {
      throw new InvalidArticleStateError('Only articles in review can be moderated');
    }

    const now = this.clock.now();
    const review = ModerationReview.record({
      id: asModerationReviewId(this.ids.next()),
      articleId: article.id,
      articleVersionId: article.currentVersionId,
      moderatorId: moderator.id,
      decision: input.decision,
      reason: input.reason,
      notes: input.notes ?? '',
      createdAt: now,
    });

    let next = article;

    if (input.decision === ModerationDecision.APPROVE) {
      next = article.approveFromReview(now).article;
    } else if (input.decision === ModerationDecision.REQUEST_REVISION) {
      next = article.requestRevision(now).article;
    } else {
      next = article.reject(now).article;
    }

    await this.reviews.save(review);
    await this.articles.save(next);

    if (this.cache) {
      await invalidatePublicDiscoveryCache(this.cache, next.slug.value);
    }
    await this.auditLogs.save(
      AuditLog.record({
        id: asAuditLogId(this.ids.next()),
        actorUserId: moderator.id,
        action: AuditAction.ARTICLE_MODERATED,
        entityType: 'Article',
        entityId: article.id,
        metadata: JSON.stringify({
          articleVersionId: article.currentVersionId,
          decision: review.decision,
          previousStatus: article.status,
          nextStatus: next.status,
        }),
        ipHash: input.ipHash ?? null,
        createdAt: now,
      }),
    );

    return {
      articleId: next.id,
      status: next.status,
      review: toModerationReviewView(review),
    };
  }
}
