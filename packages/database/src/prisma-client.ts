import { getConfig } from '@aip/config';
import { PrismaClient } from './generated/client';

export { Prisma, PrismaClient } from './generated/client';

let client: PrismaClient | undefined;

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
}

export function getPrismaClient(): PrismaClient {
  client ??= createPrismaClient(getConfig().DATABASE_URL);
  return client;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (!client) {
    return;
  }

  await client.$disconnect();
  client = undefined;
}
