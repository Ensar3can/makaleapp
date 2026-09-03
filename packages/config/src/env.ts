import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default(
      'sqlserver://localhost:1433;database=aip;integratedSecurity=true;trustServerCertificate=true;encrypt=true',
    ),
  TEST_DATABASE_URL: z
    .string()
    .min(1)
    .default(
      'sqlserver://localhost:1433;database=aip_test;integratedSecurity=true;trustServerCertificate=true;encrypt=true',
    ),
  SQLSERVER_INSTANCE: z.string().min(1).default('.\\SQLEXPRESS'),
  REDIS_URL: z.string().min(1).default('memory://local'),
  OBJECT_STORAGE_ROOT: z.string().min(1).default('.data/storage'),
  OBJECT_STORAGE_DRIVER: z.enum(['local-disk', 's3']).default('local-disk'),
  OBJECT_STORAGE_ENDPOINT: z.string().default(''),
  OBJECT_STORAGE_ACCESS_KEY: z.string().default(''),
  OBJECT_STORAGE_SECRET_KEY: z.string().default(''),
  OBJECT_STORAGE_BUCKET: z.string().min(1).default('aip'),
  OBJECT_STORAGE_REGION: z.string().min(1).default('us-east-1'),
  OBJECT_STORAGE_FORCE_PATH_STYLE: z.enum(['true', 'false']).default('true'),
  AI_PROVIDER: z.enum(['fake', 'openai']).default('fake'),
  AI_API_KEY: z.string().optional().default(''),
  AI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  MAX_ARTICLE_SIZE: z.coerce.number().int().positive().default(10_000_000),
  MAX_ARTICLE_WORDS: z.coerce.number().int().positive().default(20_000),
  MAX_AI_COST_PER_ANALYSIS: z.coerce.number().positive().default(1),
  SESSION_COOKIE_NAME: z.string().min(1).default('aip_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 7),
  SESSION_PEPPER: z.string().default(''),
});

export type AppConfig = z.infer<typeof envSchema> & {
  redisDriver: 'memory' | 'redis';
  objectStorageForcePathStyle: boolean;
};

let cached: AppConfig | undefined;
let dotenvLoaded = false;

function loadDotenvFiles(): void {
  if (dotenvLoaded) {
    return;
  }

  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
    resolve(process.cwd(), '../../../.env'),
  ];

  for (const path of candidates) {
    loadDotenv({ path, override: false });
  }

  dotenvLoaded = true;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (env === process.env) {
    loadDotenvFiles();
  }

  const parsed = envSchema.parse(env);

  const nextPhase = env.NEXT_PHASE ?? process.env.NEXT_PHASE;
  const isNextProductionBuild = nextPhase === 'phase-production-build';

  if (
    parsed.NODE_ENV === 'production' &&
    parsed.SESSION_PEPPER.trim().length < 16 &&
    !isNextProductionBuild
  ) {
    throw new Error('SESSION_PEPPER must be at least 16 characters when NODE_ENV=production');
  }

  if (parsed.AI_PROVIDER === 'openai' && parsed.AI_API_KEY.trim().length === 0) {
    throw new Error('AI_API_KEY is required when AI_PROVIDER=openai');
  }

  if (
    parsed.OBJECT_STORAGE_DRIVER === 's3' &&
    (parsed.OBJECT_STORAGE_ACCESS_KEY.trim().length === 0 ||
      parsed.OBJECT_STORAGE_SECRET_KEY.trim().length === 0)
  ) {
    throw new Error(
      'OBJECT_STORAGE_ACCESS_KEY and OBJECT_STORAGE_SECRET_KEY are required when OBJECT_STORAGE_DRIVER=s3',
    );
  }

  const redisDriver = parsed.REDIS_URL.startsWith('memory:') ? 'memory' : 'redis';

  const vercelRuntime = env.VERCEL === '1';

  if (
    parsed.NODE_ENV === 'production' &&
    redisDriver === 'memory' &&
    !isNextProductionBuild &&
    !vercelRuntime
  ) {
    throw new Error('REDIS_URL must be a Redis URL when NODE_ENV=production');
  }

  const appHost = new URL(parsed.APP_URL).hostname;
  const loopbackHost = appHost === 'localhost' || appHost === '127.0.0.1' || appHost === '::1';

  if (
    parsed.NODE_ENV === 'production' &&
    !isNextProductionBuild &&
    !loopbackHost &&
    new URL(parsed.APP_URL).protocol !== 'https:'
  ) {
    throw new Error('APP_URL must use https when NODE_ENV=production');
  }

  return {
    ...parsed,
    redisDriver,
    objectStorageForcePathStyle: parsed.OBJECT_STORAGE_FORCE_PATH_STYLE === 'true',
  };
}

export function getConfig(): AppConfig {
  cached ??= loadConfig();
  return cached;
}

export function resetConfigCache(): void {
  cached = undefined;
}
