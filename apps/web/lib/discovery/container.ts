import {
  ArticleClassificationService,
  GetHomepageDiscoveryUseCase,
  GetPublicArticleUseCase,
  GetPublicAuthorProfileUseCase,
  GetPublicCategoryUseCase,
  ListPublicCategoriesUseCase,
  ListPublishedSitemapUseCase,
  PublishArticleUseCase,
  SearchArticlesUseCase,
} from '@aip/application';
import { SystemClock, UuidGenerator } from '@aip/auth';
import { getCacheStore } from '../cache';
import { getRateLimiter } from '../rate-limit';
import {
  PrismaAnalysisEvidenceRepository,
  PrismaAnalysisJobRepository,
  PrismaAnalysisMetricRepository,
  PrismaAnalysisRunRepository,
  PrismaArticleRepository,
  PrismaArticleTaxonomyRepository,
  PrismaArticleVersionRepository,
  PrismaCategoryRepository,
  PrismaProfileRepository,
  PrismaPublicArticleDiscoveryRepository,
  PrismaScoreSnapshotRepository,
  PrismaSourceReferenceRepository,
  PrismaTagRepository,
  PrismaUserRepository,
  getPrismaClient,
} from '@aip/database';

export function getDiscoveryServices() {
  const prisma = getPrismaClient();
  const users = new PrismaUserRepository(prisma);
  const profiles = new PrismaProfileRepository(prisma);
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
  const discovery = new PrismaPublicArticleDiscoveryRepository(prisma);
  const cache = getCacheStore();
  const search = new SearchArticlesUseCase(discovery, getRateLimiter(), cache);
  const ids = new UuidGenerator();
  const clock = new SystemClock();
  const classification = new ArticleClassificationService(categories, tags, taxonomy, ids, clock);

  return {
    search,
    homepage: new GetHomepageDiscoveryUseCase(search, categories, cache),
    getPublicArticle: new GetPublicArticleUseCase(
      discovery,
      runs,
      metrics,
      evidence,
      sources,
      search,
      cache,
    ),
    getPublicCategory: new GetPublicCategoryUseCase(categories, search),
    getPublicAuthor: new GetPublicAuthorProfileUseCase(profiles, search),
    listPublicCategories: new ListPublicCategoriesUseCase(categories, cache),
    listSitemap: new ListPublishedSitemapUseCase(discovery),
    publishArticle: new PublishArticleUseCase(
      users,
      articles,
      versions,
      jobs,
      snapshots,
      classification,
      clock,
      cache,
    ),
  };
}
