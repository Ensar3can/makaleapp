import type { PrismaClient } from './generated/client';

export interface FullTextSearchProbeResult {
  readonly installed: boolean;
  readonly catalogCount: number;
}

export async function probeFullTextSearch(prisma: PrismaClient): Promise<FullTextSearchProbeResult> {
  const rows = await prisma.$queryRaw<Array<{ installed: number | null; catalogCount: number }>>`
    SELECT
      CAST(FULLTEXTSERVICEPROPERTY('IsFullTextInstalled') AS INT) AS installed,
      (SELECT COUNT(*) FROM sys.fulltext_catalogs) AS catalogCount
  `;

  return {
    installed: rows[0]?.installed === 1,
    catalogCount: rows[0]?.catalogCount ?? 0,
  };
}
