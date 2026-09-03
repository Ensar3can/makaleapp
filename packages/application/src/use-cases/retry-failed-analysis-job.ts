import {
  ANALYSIS_JOB_POLICY,
  ANALYZE_ARTICLE_JOB,
} from '../analysis-job-policy';
import {
  AnalysisJobNotFoundError,
  AnalysisJobStatus,
  ArticleNotFoundError,
  ArticleStatus,
  AuditAction,
  AuditLog,
  InvalidArticleStateError,
  InvalidAnalysisJobStateError,
  OPERATION_RATE_LIMITS,
  asAnalysisJobId,
  asAuditLogId,
  type AnalysisJobRepository,
  type ArticleRepository,
  type AuditLogRepository,
  type UserRepository,
} from '@aip/domain';
import { consumeRateLimit } from '../consume-rate-limit';
import { requireObserver } from '../observability-access';
import type { Clock, IdGenerator, JobDispatcher, RateLimiter } from '../ports';
import type { UseCase } from '../use-case';

export interface RetryFailedAnalysisJobInput {
  readonly actorUserId: string;
  readonly analysisJobId: string;
  readonly ipHash?: string | null;
}

export interface RetryFailedAnalysisJobResult {
  readonly analysisJobId: string;
  readonly articleId: string;
  readonly jobStatus: AnalysisJobStatus;
  readonly articleStatus: ArticleStatus;
}

export class RetryFailedAnalysisJobUseCase
  implements UseCase<RetryFailedAnalysisJobInput, RetryFailedAnalysisJobResult>
{
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly dispatcher: JobDispatcher,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: RetryFailedAnalysisJobInput): Promise<RetryFailedAnalysisJobResult> {
    const actor = await requireObserver(this.users, input.actorUserId);
    await consumeRateLimit(
      this.rateLimiter,
      'retry-analysis-user',
      actor.id,
      OPERATION_RATE_LIMITS.retryAnalysisJobPerUser,
    );

    const job = await this.jobs.findById(asAnalysisJobId(input.analysisJobId));

    if (!job) {
      throw new AnalysisJobNotFoundError(input.analysisJobId);
    }

    if (job.status !== AnalysisJobStatus.FAILED) {
      throw new InvalidAnalysisJobStateError('Only failed analysis jobs can be retried');
    }

    const article = await this.articles.findById(job.articleId);

    if (!article || article.status === ArticleStatus.REMOVED) {
      throw new ArticleNotFoundError(job.articleId);
    }

    if (article.currentVersionId !== job.articleVersionId) {
      throw new InvalidArticleStateError('The failed job is not bound to the current article version');
    }

    if (article.status !== ArticleStatus.ANALYSIS_FAILED) {
      throw new InvalidArticleStateError('Only failed analyses can be requeued');
    }

    const now = this.clock.now();
    const queuedArticle = article.queueForAnalysis(now).article;
    const retried = job.retry(now);

    await this.articles.save(queuedArticle);
    await this.jobs.save(retried);
    await this.dispatcher.dispatch(
      ANALYZE_ARTICLE_JOB,
      { analysisJobId: retried.id },
      { jobId: retried.id },
    );
    await this.auditLogs.save(
      AuditLog.record({
        id: asAuditLogId(this.ids.next()),
        actorUserId: actor.id,
        action: AuditAction.ANALYSIS_JOB_RETRIED,
        entityType: 'AnalysisJob',
        entityId: retried.id,
        metadata: JSON.stringify({
          articleId: article.id,
          articleVersionId: article.currentVersionId,
          previousAttemptCount: job.attemptCount,
          maxAttempts: ANALYSIS_JOB_POLICY.maxAttempts,
        }),
        ipHash: input.ipHash ?? null,
        createdAt: now,
      }),
    );

    return {
      analysisJobId: retried.id,
      articleId: queuedArticle.id,
      jobStatus: retried.status,
      articleStatus: queuedArticle.status,
    };
  }
}
