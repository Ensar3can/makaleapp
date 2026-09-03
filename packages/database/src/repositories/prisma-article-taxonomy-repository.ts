import {
  asCategoryId,
  asTagId,
  type ArticleId,
  type ArticleTaxonomyLinks,
  type ArticleTaxonomyRepository,
  type CategoryId,
  type TagId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';

export class PrismaArticleTaxonomyRepository implements ArticleTaxonomyRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async replaceCategories(articleId: ArticleId, categoryIds: readonly CategoryId[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.articleCategory.deleteMany({ where: { articleId } }),
      ...(categoryIds.length > 0
        ? [
            this.prisma.articleCategory.createMany({
              data: categoryIds.map((categoryId) => ({ articleId, categoryId })),
            }),
          ]
        : []),
    ]);
  }

  public async replaceTags(articleId: ArticleId, tagIds: readonly TagId[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.articleTag.deleteMany({ where: { articleId } }),
      ...(tagIds.length > 0
        ? [
            this.prisma.articleTag.createMany({
              data: tagIds.map((tagId) => ({ articleId, tagId })),
            }),
          ]
        : []),
    ]);
  }

  public async listCategoryIds(articleId: ArticleId): Promise<readonly CategoryId[]> {
    const rows = await this.prisma.articleCategory.findMany({ where: { articleId } });
    return rows.map((row) => asCategoryId(row.categoryId));
  }

  public async listTagIds(articleId: ArticleId): Promise<readonly TagId[]> {
    const rows = await this.prisma.articleTag.findMany({ where: { articleId } });
    return rows.map((row) => asTagId(row.tagId));
  }

  public async listLinksByArticleIds(articleIds: readonly ArticleId[]): Promise<readonly ArticleTaxonomyLinks[]> {
    if (articleIds.length === 0) {
      return [];
    }

    const ids = [...articleIds];
    const [categoryRows, tagRows] = await Promise.all([
      this.prisma.articleCategory.findMany({ where: { articleId: { in: ids } } }),
      this.prisma.articleTag.findMany({ where: { articleId: { in: ids } } }),
    ]);

    return ids.map((articleId) => ({
      articleId,
      categoryIds: categoryRows
        .filter((row) => row.articleId === articleId)
        .map((row) => asCategoryId(row.categoryId)),
      tagIds: tagRows.filter((row) => row.articleId === articleId).map((row) => asTagId(row.tagId)),
    }));
  }
}
