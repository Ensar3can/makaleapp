import type { PrismaClient } from './prisma-client';

export interface DatabaseProbeResult {
  ok: true;
}

export async function probeDatabase(prisma: PrismaClient): Promise<DatabaseProbeResult> {
  await prisma.$queryRaw`SELECT 1`;
  return { ok: true };
}
