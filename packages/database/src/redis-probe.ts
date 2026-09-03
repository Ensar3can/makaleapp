import Redis from 'ioredis';

export interface RedisProbeResult {
  ok: true;
  driver: 'memory' | 'redis';
}

export async function probeRedis(redisUrl: string): Promise<RedisProbeResult> {
  if (redisUrl.startsWith('memory:')) {
    return { ok: true, driver: 'memory' };
  }

  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 2_000,
  });

  try {
    await client.connect();
    const pong = await client.ping();

    if (pong !== 'PONG') {
      throw new Error(`Unexpected Redis PING response: ${pong}`);
    }

    return { ok: true, driver: 'redis' };
  } finally {
    client.disconnect();
  }
}
