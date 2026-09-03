import type { ArticleRepository, ArticleVersionRepository, UserRepository } from '@aip/domain';
import { requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import { toAuthorArticleSummary, type AuthorArticleSummary } from '../article-views';
import type { UseCase } from '../use-case';

export interface ListAuthorArticlesInput {
  readonly actorUserId: string;
}

export class ListAuthorArticlesUseCase implements UseCase<ListAuthorArticlesInput, readonly AuthorArticleSummary[]> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly classification: ArticleClassificationService,
  ) {}

  public async execute(input: ListAuthorArticlesInput): Promise<readonly AuthorArticleSummary[]> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    const articles = await this.articles.listByAuthorId(actor.id);
    const versionIds = articles.map((article) => article.currentVersionId);
    const [versions, taxonomyByArticle] = await Promise.all([
      this.versions.findManyByIds(versionIds),
      this.classification.loadMany(articles.map((article) => article.id)),
    ]);
    const versionById = new Map(versions.map((version) => [version.id, version]));
    const summaries: AuthorArticleSummary[] = [];

    for (const article of articles) {
      const version = versionById.get(article.currentVersionId);

      if (!version) {
        continue;
      }

      const taxonomy = taxonomyByArticle.get(article.id) ?? { categories: [], tags: [] };
      summaries.push(
        toAuthorArticleSummary({
          article,
          version,
          categories: taxonomy.categories,
          tags: taxonomy.tags,
        }),
      );
    }

    return summaries;
  }
}
