import {
  ArticleNotFoundError,
  asArticleVersionId,
  type AnalysisJobRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type UserRepository,
} from '@aip/domain';
import { loadOwnedArticle, requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import { toAuthorArticleDetail, type AuthorArticleDetail } from '../article-views';
import { hashArticlePayload } from '../content-hashing';
import type { Clock, IdGenerator } from '../ports';
import type { UseCase } from '../use-case';
import { assertWordLimit } from './create-article-draft';

export interface UpdateArticleDraftInput {
  readonly actorUserId: string;
  readonly articleId: string;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly categoryIds: readonly string[];
  readonly tagNames?: readonly string[];
}

export class UpdateArticleDraftUseCase implements UseCase<UpdateArticleDraftInput, AuthorArticleDetail> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly classification: ArticleClassificationService,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(input: UpdateArticleDraftInput): Promise<AuthorArticleDetail> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    const article = await loadOwnedArticle(this.articles, actor, input.articleId);
    assertWordLimit(input.content);

    const currentVersion = await this.versions.findById(article.currentVersionId);

    if (!currentVersion) {
      throw new ArticleNotFoundError(article.id);
    }

    const now = this.clock.now();
    const nextHash = hashArticlePayload({
      title: input.title,
      abstract: input.abstract,
      content: input.content,
    });

    let nextArticle = article;
    let nextVersion = currentVersion;

    if (!nextHash.equals(currentVersion.contentHash)) {
      const activeJob = await this.jobs.findActiveByArticleVersionId(article.currentVersionId);

      if (activeJob) {
        await this.jobs.save(activeJob.cancel(now));
      }

      const revision = article.revise({
        versionId: asArticleVersionId(this.ids.next()),
        title: input.title,
        abstract: input.abstract,
        content: input.content,
        contentHash: nextHash,
        now,
      });
      nextArticle = revision.article;
      nextVersion = revision.version;
      await this.articles.save(nextArticle);
      await this.versions.save(nextVersion);
    }

    const taxonomy = await this.classification.replace(
      nextArticle.id,
      input.categoryIds,
      input.tagNames ?? [],
    );
    const [history, job] = await Promise.all([
      this.versions.listByArticleId(nextArticle.id),
      this.jobs.findActiveByArticleVersionId(nextArticle.currentVersionId),
    ]);

    return toAuthorArticleDetail({
      article: nextArticle,
      version: nextVersion,
      versions: history,
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      analysisJobStatus: job?.status ?? null,
    });
  }
}
