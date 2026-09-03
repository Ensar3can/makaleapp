import type { Slug, Tag, TagId, TagRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toTag } from '../mappers';

export class PrismaTagRepository implements TagRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: TagId): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { id } });
    return row ? toTag(row) : null;
  }

  public async findBySlug(slug: Slug): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({ where: { slug: slug.value } });
    return row ? toTag(row) : null;
  }

  public async findManyByIds(ids: readonly TagId[]): Promise<readonly Tag[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.tag.findMany({
      where: { id: { in: [...ids] } },
    });

    return rows.map(toTag);
  }

  public async save(tag: Tag): Promise<void> {
    const data = {
      name: tag.name,
      slug: tag.slug.value,
      createdAt: tag.createdAt,
    };

    await this.prisma.tag.upsert({
      where: { id: tag.id },
      create: { id: tag.id, ...data },
      update: data,
    });
  }
}
