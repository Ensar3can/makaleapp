import { getConfig } from '@aip/config';
import { getPrismaClient, probeDatabase, probeRedis } from '@aip/database';
import { createObjectStorageFromConfig } from '@aip/storage';
import { NextResponse } from 'next/server';
import { runApiRoute } from '../../../../lib/http';

export async function GET(request: Request) {
  return runApiRoute(request, async () => {
    try {
      const config = getConfig();
      const storage = createObjectStorageFromConfig(config);
      const probeKey = 'health/ready-probe.txt';

      const [sql, redis] = await Promise.all([
        probeDatabase(getPrismaClient()),
        probeRedis(config.REDIS_URL),
      ]);

      await storage.put(probeKey, Buffer.from('ok'), 'text/plain');
      const storageOk = await storage.exists(probeKey);
      await storage.delete(probeKey);

      if (!sql.ok || !redis.ok || !storageOk) {
        return NextResponse.json({ status: 'not-ready' }, { status: 503 });
      }

      return NextResponse.json({
        status: 'ready',
        checks: {
          sqlServer: true,
          redis: true,
          objectStorage: true,
        },
      });
    } catch {
      return NextResponse.json({ status: 'not-ready' }, { status: 503 });
    }
  });
}
