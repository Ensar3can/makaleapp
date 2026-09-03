import { CategoryNotFoundError, Slug, type CategoryRepository } from '@aip/domain';
import { toPublicCategory, type PublicCategory } from '../article-views';
import type { PublicArticlePage } from '../public-article-views';
import type { UseCase } from '../use-case';
import { SearchArticlesUseCase } from './search-articles';

export interface GetPublicCategoryInput {
  readonly slug: string;
  readonly sort?: string;
  readonly cursor?: string;
  readonly minOverallScore?: number;
  readonly maxOverallScore?: number;
  readonly query?: string;
  readonly limit?: number;
}

export interface PublicCategoryPage {
  readonly category: PublicCategory;
  readonly articles: PublicArticlePage;
}

export class GetPublicCategoryUseCase implements UseCase<GetPublicCategoryInput, PublicCategoryPage> {
  public constructor(
    private readonly categories: CategoryRepository,
    private readonly search: SearchArticlesUseCase,
  ) {}

  public async execute(input: GetPublicCategoryInput): Promise<PublicCategoryPage> {
    const slug = parseCategorySlug(input.slug);
    const category = await this.categories.findBySlug(slug);

    if (!category?.isActive) {
      throw new CategoryNotFoundError(input.slug);
    }

    const articles = await this.search.execute({
      categorySlug: category.slug.value,
      sort: input.sort,
      cursor: input.cursor,
      minOverallScore: input.minOverallScore,
      maxOverallScore: input.maxOverallScore,
      query: input.query,
      limit: input.limit,
    });

    return {
      category: toPublicCategory(category),
      articles,
    };
  }
}

function parseCategorySlug(value: string): Slug {
  try {
    return Slug.from(value);
  } catch {
    throw new CategoryNotFoundError(value);
  }
}
