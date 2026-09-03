import {
  GetObservabilityDashboardUseCase,
  ListMonitoredAnalysisJobsUseCase,
  RetryFailedAnalysisJobUseCase,
  type InfrastructureHealthProbe,
} from '@aip/application';
import { SystemClock, UuidGenerator } from '@aip/auth';
import { getConfig } from '@aip/config';
import {
  PrismaAnalysisJobRepository,
  PrismaArticleRepository,
  PrismaAuditLogRepository,
  PrismaObservabilityRepository,
  PrismaOperationalEventRepository,
  PrismaUserRepository,
  getPrismaClient,
  probeDatabase,
  probeRedis,
} from '@aip/database';
import { createObjectStorageFromConfig } from '@aip/storage';
import { getJobDispatcher } from '../jobs/queue-job-dispatcher';
import { getRateLimiter } from '../rate-limit';

class ProbeInfrastructureHealth implements InfrastructureHealthProbe {
  public async check() {
    const config = getConfig();
    const storage = createObjectStorageFromConfig(config);
    const probeKey = 'health/admin-probe.txt';

    try {
      const [sql, redis] = await Promise.all([
        probeDatabase(getPrismaClient()),
        probeRedis(config.REDIS_URL),
      ]);
      await storage.put(probeKey, Buffer.from('ok'), 'text/plain');
      const storageOk = await storage.exists(probeKey);
      await storage.delete(probeKey);

      return {
        sqlServer: sql.ok,
        redis: redis.ok,
        objectStorage: storageOk,
      };
    } catch {
      return { sqlServer: false, redis: false, objectStorage: false };
    }
  }
}

export function getObservabilityServices() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const jobs = new PrismaAnalysisJobRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);
  const observability = new PrismaObservabilityRepository(prisma);
  const ids = new UuidGenerator();
  const clock = new SystemClock();

  return {
    dashboard: new GetObservabilityDashboardUseCase(
      users,
      observability,
      new ProbeInfrastructureHealth(),
      clock,
    ),
    listJobs: new ListMonitoredAnalysisJobsUseCase(users, observability),
    retryJob: new RetryFailedAnalysisJobUseCase(
      users,
      articles,
      jobs,
      auditLogs,
      getJobDispatcher(),
      ids,
      clock,
      getRateLimiter(),
    ),
    events: new PrismaOperationalEventRepository(prisma),
    ids,
    clock,
  };
}
