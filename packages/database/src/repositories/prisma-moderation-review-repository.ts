import type { ArticleId, ModerationReview, ModerationReviewId, ModerationReviewRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toModerationReview } from '../mappers';

export class PrismaModerationReviewRepository implements ModerationReviewRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: ModerationReviewId): Promise<ModerationReview | null> {
    const row = await this.prisma.moderationReview.findUnique({ where: { id } });
    return row ? toModerationReview(row) : null;
  }

  public async listByArticleId(articleId: ArticleId): Promise<readonly ModerationReview[]> {
    const rows = await this.prisma.moderationReview.findMany({
      where: { articleId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toModerationReview);
  }

  public async save(review: ModerationReview): Promise<void> {
    const data = {
      articleId: review.articleId,
      articleVersionId: review.articleVersionId,
      moderatorId: review.moderatorId,
      decision: review.decision,
      reason: review.reason,
      notes: review.notes,
      createdAt: review.createdAt,
    };

    await this.prisma.moderationReview.upsert({
      where: { id: review.id },
      create: { id: review.id, ...data },
      update: data,
    });
  }
}
