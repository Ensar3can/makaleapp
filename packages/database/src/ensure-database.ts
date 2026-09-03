import { createPrismaClient } from './prisma-client';

const DATABASE_NAME = /(?:^|;)\s*database=([^;]+)/i;

export function databaseNameFromUrl(databaseUrl: string): string {
  const match = DATABASE_NAME.exec(databaseUrl);
  const name = match?.[1]?.trim();

  if (!name) {
    throw new Error('DATABASE_URL must include database=');
  }

  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error('DATABASE_URL database name is not safe');
  }

  return name;
}

export function masterDatabaseUrl(databaseUrl: string): string {
  const name = databaseNameFromUrl(databaseUrl);

  if (name.toLowerCase() === 'master') {
    throw new Error('DATABASE_URL must not point at master');
  }

  return databaseUrl.replace(DATABASE_NAME, (segment) =>
    segment.replace(/database=[^;]+/i, 'database=master'),
  );
}

export async function ensureDatabaseExists(databaseUrl: string): Promise<string> {
  const name = databaseNameFromUrl(databaseUrl);
  const prisma = createPrismaClient(masterDatabaseUrl(databaseUrl));

  try {
    await prisma.$executeRawUnsafe(
      `IF DB_ID(N'${name}') IS NULL CREATE DATABASE [${name}];`,
    );
    return name;
  } finally {
    await prisma.$disconnect();
  }
}
