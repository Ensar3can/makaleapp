import {
  ArticleAlreadyPublishedError,
  AnalysisNotCompletedError,
  ArticleStatus,
  InvalidArticleStateError,
  type ArticleRepository,
  type ArticleVersionRepository,
  type AnalysisJobRepository,
  type ScoreSnapshotRepository,
  type UserRepository,
} from '@aip/domain';
import { assertEmailVerified, loadOwnedArticle, requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import { toAuthorArticleDetail, toAuthorScoreView, type AuthorArticleDetail } from '../article-views';
import type { CacheStore, Clock } from '../ports';
import { invalidatePublicDiscoveryCache } from '../public-cache';
import type { UseCase } from '../use-case';

export interface PublishArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
}

export class PublishArticleUseCase implements UseCase<PublishArticleInput, AuthorArticleDetail> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly snapshots: ScoreSnapshotRepository,
    private readonly classification: ArticleClassificationService,
    private readonly clock: Clock,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(input: PublishArticleInput): Promise<AuthorArticleDetail> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    assertEmailVerified(actor);

    const article = await loadOwnedArticle(this.articles, actor, input.articleId);

    if (article.status === ArticleStatus.REQUIRES_REVIEW) {
      throw new InvalidArticleStateError('This article is in the moderation queue and cannot be published');
    }

    if (article.status === ArticleStatus.PUBLISHED) {
      throw new ArticleAlreadyPublishedError();
    }

    const version = await this.versions.findById(article.currentVersionId);

    if (!version) {
      throw new InvalidArticleStateError('Current article version is missing');
    }

    const snapshot = await this.snapshots.findLatestByArticleVersionId(article.currentVersionId);

    if (!snapshot?.isBoundTo(article.currentVersionId)) {
      throw new AnalysisNotCompletedError(
        'A ScoreSnapshot for the current version is required before publication',
      );
    }

    const now = this.clock.now();
    let current = article;

    if (current.status === ArticleStatus.ANALYSIS_COMPLETED) {
      current = current.markReadyForPublication(now).article;
    }

    current = current.publish(now).article;
    await this.articles.save(current);

    if (this.cache) {
      await invalidatePublicDiscoveryCache(this.cache, current.slug.value);
    }

    const [taxonomy, history, job] = await Promise.all([
      this.classification.load(current.id),
      this.versions.listByArticleId(current.id),
      this.jobs.findActiveByArticleVersionId(current.currentVersionId),
    ]);

    return toAuthorArticleDetail({
      article: current,
      version,
      versions: history,
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      analysisJobStatus: job?.status ?? null,
      score: toAuthorScoreView(snapshot),
    });
  }
}
