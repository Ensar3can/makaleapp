import type { Session, SessionId, SessionRepository, UserId } from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toSession } from '../mappers';

export class PrismaSessionRepository implements SessionRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: SessionId): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id } });
    return row ? toSession(row) : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { tokenHash } });
    return row ? toSession(row) : null;
  }

  public async save(session: Session): Promise<void> {
    const data = {
      userId: session.userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      ipHash: session.ipHash,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
    };

    await this.prisma.session.upsert({
      where: { id: session.id },
      create: { id: session.id, ...data },
      update: data,
    });
  }

  public async revokeAllForUser(userId: UserId, now: Date): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
