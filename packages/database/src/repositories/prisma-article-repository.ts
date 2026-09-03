import { ArticleStatus, type Article, type ArticleId, type ArticleRepository, type ContentHash, type Slug, type UserId } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toArticle } from '../mappers';

export class PrismaArticleRepository implements ArticleRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: ArticleId): Promise<Article | null> {
    const row = await this.prisma.article.findUnique({ where: { id } });
    return row ? toArticle(row) : null;
  }

  public async findBySlug(slug: Slug): Promise<Article | null> {
    const row = await this.prisma.article.findUnique({ where: { slug: slug.value } });
    return row ? toArticle(row) : null;
  }

  public async listByAuthorId(authorId: UserId): Promise<readonly Article[]> {
    const rows = await this.prisma.article.findMany({
      where: { authorId, status: { not: ArticleStatus.REMOVED } },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map(toArticle);
  }

  public async listByStatus(status: ArticleStatus): Promise<readonly Article[]> {
    const rows = await this.prisma.article.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map(toArticle);
  }

  public async listByCurrentContentHash(hash: ContentHash): Promise<readonly Article[]> {
    const rows = await this.prisma.article.findMany({
      where: { currentContentHash: hash.value, status: { not: ArticleStatus.REMOVED } },
    });

    return rows.map(toArticle);
  }

  public async save(article: Article): Promise<void> {
    const data = {
      authorId: article.authorId,
      slug: article.slug.value,
      language: article.language,
      status: article.status,
      currentVersionId: article.currentVersionId,
      currentVersionNumber: article.currentVersionNumber,
      currentContentHash: article.currentContentHash.value,
      publishedAt: article.publishedAt,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    };

    await this.prisma.article.upsert({
      where: { id: article.id },
      create: { id: article.id, ...data },
      update: data,
    });
  }
}
