import type { ArticleId, ArticleVersion, ArticleVersionId, ArticleVersionRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toArticleVersion } from '../mappers';

export class PrismaArticleVersionRepository implements ArticleVersionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: ArticleVersionId): Promise<ArticleVersion | null> {
    const row = await this.prisma.articleVersion.findUnique({ where: { id } });
    return row ? toArticleVersion(row) : null;
  }

  public async findManyByIds(ids: readonly ArticleVersionId[]): Promise<readonly ArticleVersion[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.articleVersion.findMany({
      where: { id: { in: [...ids] } },
    });

    return rows.map(toArticleVersion);
  }

  public async listByArticleId(articleId: ArticleId): Promise<readonly ArticleVersion[]> {
    const rows = await this.prisma.articleVersion.findMany({
      where: { articleId },
      orderBy: { versionNumber: 'asc' },
    });

    return rows.map(toArticleVersion);
  }

  public async save(version: ArticleVersion): Promise<void> {
    const data = {
      articleId: version.articleId,
      versionNumber: version.versionNumber,
      title: version.title,
      abstract: version.abstract,
      content: version.content,
      contentHash: version.contentHash.value,
      createdAt: version.createdAt,
    };

    await this.prisma.articleVersion.upsert({
      where: { id: version.id },
      create: { id: version.id, ...data },
      update: data,
    });
  }
}
