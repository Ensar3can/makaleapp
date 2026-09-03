import { createHash, randomUUID } from 'node:crypto';
import { ContentHash } from '@aip/domain';
import { getConfig } from '@aip/config';
import { Prisma } from './generated/client';
import { createPrismaClient } from './prisma-client';
import { resetDatabase } from './reset-database';

export function newId(): string {
  return randomUUID();
}

export function hashContent(content: string): ContentHash {
  return ContentHash.from(createHash('sha256').update(content, 'utf8').digest('hex'));
}

export function createTestPrisma() {
  return createPrismaClient(getConfig().TEST_DATABASE_URL);
}

export async function connectOrExplain(prisma: ReturnType<typeof createTestPrisma>): Promise<void> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Prisma cannot reach SQL Server on TCP 1433. Run scripts/enable-sqlexpress-tcp.ps1 as Administrator, then retry. ${detail}`,
    );
  }
}

export { resetDatabase };

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
