import {
  FlagArticleUseCase,
  GetModerationArticleUseCase,
  ListModerationQueueUseCase,
  ModerateArticleUseCase,
} from '@aip/application';
import { SystemClock, UuidGenerator } from '@aip/auth';
import { getCacheStore } from '../cache';
import { getRateLimiter } from '../rate-limit';
import {
  PrismaAnalysisEvidenceRepository,
  PrismaAnalysisMetricRepository,
  PrismaAnalysisRunRepository,
  PrismaArticleRepository,
  PrismaArticleVersionRepository,
  PrismaAuditLogRepository,
  PrismaModerationReviewRepository,
  PrismaProfileRepository,
  PrismaScoreSnapshotRepository,
  PrismaSourceReferenceRepository,
  PrismaUserRepository,
  getPrismaClient,
} from '@aip/database';

export function getModerationServices() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const versions = new PrismaArticleVersionRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
  const snapshots = new PrismaScoreSnapshotRepository(prisma);
  const runs = new PrismaAnalysisRunRepository(prisma);
  const metrics = new PrismaAnalysisMetricRepository(prisma);
  const evidence = new PrismaAnalysisEvidenceRepository(prisma);
  const sources = new PrismaSourceReferenceRepository(prisma);
  const reviews = new PrismaModerationReviewRepository(prisma);
  const auditLogs = new PrismaAuditLogRepository(prisma);
  const ids = new UuidGenerator();
  const clock = new SystemClock();

  return {
    listQueue: new ListModerationQueueUseCase(
      users,
      articles,
      versions,
      profiles,
      snapshots,
      runs,
      evidence,
    ),
    getArticle: new GetModerationArticleUseCase(
      users,
      articles,
      versions,
      profiles,
      snapshots,
      runs,
      metrics,
      evidence,
      sources,
      reviews,
    ),
    moderateArticle: new ModerateArticleUseCase(
      users,
      articles,
      reviews,
      auditLogs,
      ids,
      clock,
      getRateLimiter(),
      getCacheStore(),
    ),
    flagArticle: new FlagArticleUseCase(
      users,
      articles,
      auditLogs,
      ids,
      clock,
      getRateLimiter(),
      getCacheStore(),
    ),
  };
}
