import type { Category, CategoryId, CategoryRepository, Slug } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toCategory } from '../mappers';

export class PrismaCategoryRepository implements CategoryRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: CategoryId): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? toCategory(row) : null;
  }

  public async findBySlug(slug: Slug): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { slug: slug.value } });
    return row ? toCategory(row) : null;
  }

  public async findManyByIds(ids: readonly CategoryId[]): Promise<readonly Category[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.category.findMany({
      where: { id: { in: [...ids] } },
    });

    return rows.map(toCategory);
  }

  public async listActive(): Promise<readonly Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return rows.map(toCategory);
  }

  public async save(category: Category): Promise<void> {
    const data = {
      name: category.name,
      slug: category.slug.value,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    await this.prisma.category.upsert({
      where: { id: category.id },
      create: { id: category.id, ...data },
      update: data,
    });
  }
}
