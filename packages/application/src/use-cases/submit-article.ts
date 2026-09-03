import {
  ArticleStatus,
  InvalidArticleStateError,
  OPERATION_RATE_LIMITS,
  type AnalysisJobRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type UserRepository,
} from '@aip/domain';
import { assertEmailVerified, loadOwnedArticle, requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import { toAuthorArticleDetail, type AuthorArticleDetail } from '../article-views';
import { consumeRateLimit } from '../consume-rate-limit';
import { ValidationError } from '../errors';
import type { AnalysisScheduler, Clock, RateLimiter } from '../ports';
import type { UseCase } from '../use-case';

export interface SubmitArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
}

export class SubmitArticleUseCase implements UseCase<SubmitArticleInput, AuthorArticleDetail> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly classification: ArticleClassificationService,
    private readonly analysis: AnalysisScheduler,
    private readonly clock: Clock,
    private readonly rateLimiter: RateLimiter,
  ) {}

  public async execute(input: SubmitArticleInput): Promise<AuthorArticleDetail> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    assertEmailVerified(actor);

    const article = await loadOwnedArticle(this.articles, actor, input.articleId);
    const version = await this.versions.findById(article.currentVersionId);

    if (!version) {
      throw new InvalidArticleStateError('Current article version is missing');
    }

    const taxonomy = await this.classification.load(article.id);

    if (taxonomy.categories.length < 1) {
      throw new ValidationError('Select at least one category before submitting');
    }

    const now = this.clock.now();

    if (article.status === ArticleStatus.QUEUED_FOR_ANALYSIS) {
      const job = await this.jobs.findActiveByArticleVersionId(article.currentVersionId);
      return toAuthorArticleDetail({
        article,
        version,
        versions: await this.versions.listByArticleId(article.id),
        categories: taxonomy.categories,
        tags: taxonomy.tags,
        analysisJobStatus: job?.status ?? null,
      });
    }

    await consumeRateLimit(
      this.rateLimiter,
      'submit-user',
      actor.id,
      OPERATION_RATE_LIMITS.submitArticlePerUser,
    );

    const submitted =
      article.status === ArticleStatus.SUBMITTED ? article : article.submit(version, now).article;
    const scheduled = await this.analysis.schedule(submitted, now);
    const job = await this.jobs.findActiveByArticleVersionId(scheduled.article.currentVersionId);

    return toAuthorArticleDetail({
      article: scheduled.article,
      version,
      versions: await this.versions.listByArticleId(scheduled.article.id),
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      analysisJobStatus: job?.status ?? scheduled.job.status,
    });
  }
}
