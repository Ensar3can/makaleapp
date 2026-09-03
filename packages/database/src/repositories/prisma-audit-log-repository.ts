import type { AuditLog, AuditLogId, AuditLogRepository } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toAuditLog } from '../mappers';

export class PrismaAuditLogRepository implements AuditLogRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AuditLogId): Promise<AuditLog | null> {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? toAuditLog(row) : null;
  }

  public async listByEntity(entityType: string, entityId: string): Promise<readonly AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toAuditLog);
  }

  public async save(entry: AuditLog): Promise<void> {
    const data = {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      ipHash: entry.ipHash,
      createdAt: entry.createdAt,
    };

    await this.prisma.auditLog.upsert({
      where: { id: entry.id },
      create: { id: entry.id, ...data },
      update: data,
    });
  }
}
