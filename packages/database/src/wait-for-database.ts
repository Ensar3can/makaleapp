import { probeDatabase } from './database-probe';
import { createPrismaClient } from './prisma-client';

export interface WaitForDatabaseOptions {
  attempts?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export async function waitForDatabase(
  databaseUrl: string,
  options: WaitForDatabaseOptions = {},
): Promise<void> {
  const attempts = options.attempts ?? 40;
  const delayMs = options.delayMs ?? 3_000;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const prisma = createPrismaClient(databaseUrl);

    try {
      await probeDatabase(prisma);
      return;
    } catch (error: unknown) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(delayMs);
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'database was not ready';
  throw new Error(`Database did not become ready after ${attempts} attempts: ${message}`);
}
