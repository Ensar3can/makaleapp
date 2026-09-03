import type { ConnectionOptions } from 'bullmq';

export function connectionFromRedisUrl(redisUrl: string): ConnectionOptions {
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export function isDuplicateJobError(error: unknown): boolean {
  return error instanceof Error && /already exists|duplicat/i.test(error.message);
}
