import {
  CategoryNotFoundError,
  Tag,
  asCategoryId,
  asTagId,
  type ArticleId,
  type ArticleTaxonomyRepository,
  type Category,
  type CategoryRepository,
  type TagRepository,
} from '@aip/domain';
import { ARTICLE_LIMITS } from './article-limits';
import { ValidationError } from './errors';
import type { Clock, IdGenerator } from './ports';
import { slugFromLabel } from './slugify';

export class ArticleClassificationService {
  public constructor(
    private readonly categories: CategoryRepository,
    private readonly tags: TagRepository,
    private readonly taxonomy: ArticleTaxonomyRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  public async replace(
    articleId: ArticleId,
    categoryIds: readonly string[],
    tagNames: readonly string[] = [],
  ): Promise<{ categories: readonly Category[]; tags: readonly Tag[] }> {
    const uniqueCategoryIds = [...new Set(categoryIds)];

    if (
      uniqueCategoryIds.length < ARTICLE_LIMITS.minCategories ||
      uniqueCategoryIds.length > ARTICLE_LIMITS.maxCategories
    ) {
      throw new ValidationError(
        `Select between ${ARTICLE_LIMITS.minCategories} and ${ARTICLE_LIMITS.maxCategories} categories`,
      );
    }

    if (tagNames.length > ARTICLE_LIMITS.maxTags) {
      throw new ValidationError(`Select at most ${ARTICLE_LIMITS.maxTags} tags`);
    }

    const categories: Category[] = [];

    for (const categoryId of uniqueCategoryIds) {
      const category = await this.categories.findById(asCategoryId(categoryId));

      if (!category?.isActive) {
        throw new CategoryNotFoundError(categoryId);
      }

      categories.push(category);
    }

    const tags: Tag[] = [];
    const seen = new Set<string>();

    for (const rawName of tagNames) {
      const name = rawName.trim();

      if (name.length === 0) {
        continue;
      }

      const slug = slugFromLabel(name, 'tag');

      if (seen.has(slug.value)) {
        continue;
      }

      seen.add(slug.value);
      const existing = await this.tags.findBySlug(slug);
      const tag =
        existing ??
        Tag.create({
          id: asTagId(this.ids.next()),
          name,
          slug,
          now: this.clock.now(),
        });

      if (!existing) {
        await this.tags.save(tag);
      }

      tags.push(tag);
    }

    await this.taxonomy.replaceCategories(
      articleId,
      categories.map((category) => category.id),
    );
    await this.taxonomy.replaceTags(
      articleId,
      tags.map((tag) => tag.id),
    );

    return { categories, tags };
  }

  public async load(articleId: ArticleId): Promise<{ categories: readonly Category[]; tags: readonly Tag[] }> {
    const loaded = await this.loadMany([articleId]);
    return loaded.get(articleId) ?? { categories: [], tags: [] };
  }

  public async loadMany(
    articleIds: readonly ArticleId[],
  ): Promise<ReadonlyMap<ArticleId, { categories: readonly Category[]; tags: readonly Tag[] }>> {
    const result = new Map<ArticleId, { categories: readonly Category[]; tags: readonly Tag[] }>();

    if (articleIds.length === 0) {
      return result;
    }

    const links = await this.taxonomy.listLinksByArticleIds(articleIds);
    const categoryIds = [...new Set(links.flatMap((link) => link.categoryIds))];
    const tagIds = [...new Set(links.flatMap((link) => link.tagIds))];
    const [categories, tags] = await Promise.all([
      this.categories.findManyByIds(categoryIds),
      this.tags.findManyByIds(tagIds),
    ]);
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const tagById = new Map(tags.map((tag) => [tag.id, tag]));
    const linksByArticle = new Map(links.map((link) => [link.articleId, link]));

    for (const articleId of articleIds) {
      const link = linksByArticle.get(articleId);
      result.set(articleId, {
        categories: (link?.categoryIds ?? []).flatMap((id) => {
          const category = categoryById.get(id);
          return category ? [category] : [];
        }),
        tags: (link?.tagIds ?? []).flatMap((id) => {
          const tag = tagById.get(id);
          return tag ? [tag] : [];
        }),
      });
    }

    return result;
  }
}
