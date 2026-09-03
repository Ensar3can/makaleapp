import {
  Article,
  asArticleId,
  asArticleVersionId,
  type ArticleRepository,
  type ArticleVersionRepository,
  type UserRepository,
} from '@aip/domain';
import { requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import { ARTICLE_LIMITS, countWords } from '../article-limits';
import { toAuthorArticleDetail, type AuthorArticleDetail } from '../article-views';
import { hashArticlePayload } from '../content-hashing';
import { ValidationError } from '../errors';
import type { Clock, IdGenerator } from '../ports';
import { slugFromLabel } from '../slugify';
import type { UseCase } from '../use-case';

export interface CreateArticleDraftInput {
  readonly actorUserId: string;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly language: string;
  readonly categoryIds: readonly string[];
  readonly tagNames?: readonly string[];
}

export class CreateArticleDraftUseCase implements UseCase<CreateArticleDraftInput, AuthorArticleDetail> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly classification: ArticleClassificationService,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async execute(input: CreateArticleDraftInput): Promise<AuthorArticleDetail> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    assertWordLimit(input.content);

    const now = this.clock.now();
    const slug = await this.allocateSlug(input.title);
    const drafted = Article.draft({
      id: asArticleId(this.ids.next()),
      authorId: actor.id,
      versionId: asArticleVersionId(this.ids.next()),
      title: input.title,
      abstract: input.abstract,
      content: input.content,
      contentHash: hashArticlePayload({
        title: input.title,
        abstract: input.abstract,
        content: input.content,
      }),
      language: input.language,
      slug,
      now,
    });

    await this.articles.save(drafted.article);
    await this.versions.save(drafted.version);
    const taxonomy = await this.classification.replace(
      drafted.article.id,
      input.categoryIds,
      input.tagNames ?? [],
    );

    return toAuthorArticleDetail({
      article: drafted.article,
      version: drafted.version,
      versions: [drafted.version],
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      analysisJobStatus: null,
    });
  }

  private async allocateSlug(title: string) {
    const base = slugFromLabel(title, 'article');

    if (!(await this.articles.findBySlug(base))) {
      return base;
    }

    for (let suffix = 2; suffix < 50; suffix += 1) {
      const candidate = slugFromLabel(`${title}-${suffix}`, `article-${suffix}`);

      if (!(await this.articles.findBySlug(candidate))) {
        return candidate;
      }
    }

    throw new ValidationError('Unable to allocate a unique article slug');
  }
}

export function assertWordLimit(content: string): void {
  if (countWords(content) > ARTICLE_LIMITS.maxWords) {
    throw new ValidationError(`Article body must be at most ${ARTICLE_LIMITS.maxWords} words`);
  }
}
