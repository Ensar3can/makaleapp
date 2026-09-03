import {
  AnalysisEvidenceType,
  AnalysisRunStatus,
  ArticleNotFoundError,
  PUBLIC_DISCOVERY_LIMITS,
  Slug,
  type AnalysisEvidenceRepository,
  type AnalysisMetricRepository,
  type AnalysisRunRepository,
  type PublicArticleDiscoveryRepository,
  type SourceReferenceRepository,
} from '@aip/domain';
import { toAuthorContentAnalysis } from '../article-views';
import type { CacheStore } from '../ports';
import { PUBLIC_CACHE_KEYS, PUBLIC_CACHE_TTL_MS } from '../public-cache';
import {
  toPublicArticleCardFromParts,
  toPublicAuthorshipCard,
  type PublicArticleDetail,
} from '../public-article-views';
import type { UseCase } from '../use-case';
import { SearchArticlesUseCase } from './search-articles';

export interface GetPublicArticleInput {
  readonly slug: string;
}

export class GetPublicArticleUseCase implements UseCase<GetPublicArticleInput, PublicArticleDetail> {
  public constructor(
    private readonly discovery: PublicArticleDiscoveryRepository,
    private readonly runs: AnalysisRunRepository,
    private readonly metrics: AnalysisMetricRepository,
    private readonly evidence: AnalysisEvidenceRepository,
    private readonly sources: SourceReferenceRepository,
    private readonly search: SearchArticlesUseCase,
    private readonly cache?: CacheStore,
  ) {}

  public async execute(input: GetPublicArticleInput): Promise<PublicArticleDetail> {
    const slug = parsePublicSlug(input.slug);
    const cached = this.cache
      ? await this.cache.get<PublicArticleDetail>(PUBLIC_CACHE_KEYS.article(slug.value))
      : null;

    if (cached) {
      return cached;
    }

    const record = await this.discovery.findPublishedBySlug(slug);

    if (!record) {
      throw new ArticleNotFoundError(input.slug);
    }

    const runs = await this.runs.listByArticleVersionId(record.article.currentVersionId);
    const completedRun = [...runs].reverse().find((run) => run.status === AnalysisRunStatus.COMPLETED);
    const [metrics, evidenceItems, sources] = completedRun
      ? await Promise.all([
          this.metrics.listByAnalysisRunId(completedRun.id),
          this.evidence.listByAnalysisRunId(completedRun.id),
          this.sources.listByAnalysisRunId(completedRun.id),
        ])
      : [[], [], []] as const;

    const analysis = completedRun
      ? toAuthorContentAnalysis({
          pipelineVersion: completedRun.pipelineVersion,
          metrics,
          evidence: evidenceItems,
          sources,
        })
      : null;
    const disclaimer = evidenceItems.find(
      (item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER,
    )?.evidence;

    const related = await this.search.execute({
      categorySlug: record.categories[0]?.slug.value,
      excludeArticleId: record.article.id,
      sort: 'overall_score',
      limit: PUBLIC_DISCOVERY_LIMITS.relatedSize,
    });

    const card = toPublicArticleCardFromParts(
      record.article,
      record.version,
      record.snapshot,
      record.author,
      record.categories,
      record.tags,
      record.wordCount,
    );

    const detail: PublicArticleDetail = {
      ...card,
      id: record.article.id,
      content: record.version.content,
      author: {
        ...card.author,
        bio: record.author.bio,
        websiteUrl: record.author.websiteUrl,
      },
      metrics: analysis?.metrics ?? [],
      authorship: toPublicAuthorshipCard(record.snapshot, disclaimer),
      sources: analysis?.sources ?? [],
      related: related.items.filter((item) => item.slug !== card.slug),
    };

    await this.cache?.set(PUBLIC_CACHE_KEYS.article(slug.value), detail, PUBLIC_CACHE_TTL_MS.article);
    return detail;
  }
}

function parsePublicSlug(value: string): Slug {
  try {
    return Slug.from(value);
  } catch {
    throw new ArticleNotFoundError(value);
  }
}
