import {
  type OperationalEvent,
  type OperationalEventId,
  type OperationalEventRepository,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toOperationalEvent } from '../mappers';

export class PrismaOperationalEventRepository implements OperationalEventRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: OperationalEventId): Promise<OperationalEvent | null> {
    const row = await this.prisma.operationalEvent.findUnique({ where: { id } });
    return row ? toOperationalEvent(row) : null;
  }

  public async listRecent(limit: number): Promise<readonly OperationalEvent[]> {
    const rows = await this.prisma.operationalEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toOperationalEvent);
  }

  public async save(event: OperationalEvent): Promise<void> {
    await this.prisma.operationalEvent.create({
      data: {
        id: event.id,
        kind: event.kind,
        requestId: event.requestId,
        userId: event.userId,
        articleId: event.articleId,
        analysisRunId: event.analysisRunId,
        jobId: event.jobId,
        durationMs: event.durationMs,
        status: event.status,
        message: event.message,
        createdAt: event.createdAt,
      },
    });
  }
}
