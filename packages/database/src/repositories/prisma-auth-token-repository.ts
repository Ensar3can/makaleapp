import type {
  AuthToken,
  AuthTokenId,
  AuthTokenPurpose,
  AuthTokenRepository,
  UserId,
} from '@aip/domain';
import type { PrismaClient } from '../generated/client';
import { toAuthToken } from '../mappers';

export class PrismaAuthTokenRepository implements AuthTokenRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: AuthTokenId): Promise<AuthToken | null> {
    const row = await this.prisma.authToken.findUnique({ where: { id } });
    return row ? toAuthToken(row) : null;
  }

  public async findByTokenHash(tokenHash: string): Promise<AuthToken | null> {
    const row = await this.prisma.authToken.findUnique({ where: { tokenHash } });
    return row ? toAuthToken(row) : null;
  }

  public async save(token: AuthToken): Promise<void> {
    const data = {
      userId: token.userId,
      purpose: token.purpose,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      consumedAt: token.consumedAt,
      createdAt: token.createdAt,
    };

    await this.prisma.authToken.upsert({
      where: { id: token.id },
      create: { id: token.id, ...data },
      update: data,
    });
  }

  public async consumeUnconsumed(userId: UserId, purpose: AuthTokenPurpose, now: Date): Promise<void> {
    await this.prisma.authToken.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: now },
    });
  }
}
