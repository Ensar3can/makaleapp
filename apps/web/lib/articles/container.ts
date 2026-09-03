import {
  ArticleClassificationService,
  CreateArticleDraftUseCase,
  FakeAnalysisService,
  GetAuthorArticleUseCase,
  ListActiveCategoriesUseCase,
  ListAuthorArticlesUseCase,
  PublishArticleUseCase,
  SubmitArticleUseCase,
  UpdateArticleDraftUseCase,
} from '@aip/application';
import { getJobDispatcher } from '../jobs/queue-job-dispatcher';
import { getRateLimiter } from '../rate-limit';
import { SystemClock, UuidGenerator } from '@aip/auth';
import {
  PrismaAnalysisEvidenceRepository,
  PrismaAnalysisJobRepository,
  PrismaAnalysisMetricRepository,
  PrismaAnalysisRunRepository,
  PrismaArticleRepository,
  PrismaArticleTaxonomyRepository,
  PrismaArticleVersionRepository,
  PrismaCategoryRepository,
  PrismaScoreSnapshotRepository,
  PrismaSourceReferenceRepository,
  PrismaTagRepository,
  PrismaUserRepository,
  getPrismaClient,
} from '@aip/database';

export function getArticleServices() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const articles = new PrismaArticleRepository(prisma);
  const versions = new PrismaArticleVersionRepository(prisma);
  const categories = new PrismaCategoryRepository(prisma);
  const tags = new PrismaTagRepository(prisma);
  const taxonomy = new PrismaArticleTaxonomyRepository(prisma);
  const jobs = new PrismaAnalysisJobRepository(prisma);
  const runs = new PrismaAnalysisRunRepository(prisma);
  const metrics = new PrismaAnalysisMetricRepository(prisma);
  const evidence = new PrismaAnalysisEvidenceRepository(prisma);
  const sources = new PrismaSourceReferenceRepository(prisma);
  const snapshots = new PrismaScoreSnapshotRepository(prisma);
  const ids = new UuidGenerator();
  const clock = new SystemClock();
  const classification = new ArticleClassificationService(categories, tags, taxonomy, ids, clock);
  const analysis = new FakeAnalysisService(articles, jobs, ids, getJobDispatcher());

  return {
    createDraft: new CreateArticleDraftUseCase(users, articles, versions, classification, ids, clock),
    updateDraft: new UpdateArticleDraftUseCase(
      users,
      articles,
      versions,
      jobs,
      classification,
      ids,
      clock,
    ),
    submitArticle: new SubmitArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      classification,
      analysis,
      clock,
      getRateLimiter(),
    ),
    getAuthorArticle: new GetAuthorArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      runs,
      metrics,
      evidence,
      sources,
      snapshots,
      classification,
    ),
    listAuthorArticles: new ListAuthorArticlesUseCase(users, articles, versions, classification),
    listActiveCategories: new ListActiveCategoriesUseCase(users, categories),
    publishArticle: new PublishArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      snapshots,
      classification,
      clock,
    ),
  };
}
