import {
  AnalysisRunStatus,
  ArticleNotFoundError,
  type AnalysisEvidenceRepository,
  type AnalysisJobRepository,
  type AnalysisMetricRepository,
  type AnalysisRunRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type ScoreSnapshotRepository,
  type SourceReferenceRepository,
  type UserRepository,
} from '@aip/domain';
import { loadOwnedArticle, requireArticleAuthor } from '../article-access';
import { ArticleClassificationService } from '../article-classification';
import {
  toAuthorArticleDetail,
  toAuthorContentAnalysis,
  toAuthorScoreView,
  type AuthorArticleDetail,
} from '../article-views';
import type { UseCase } from '../use-case';

export interface GetAuthorArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
}

export class GetAuthorArticleUseCase implements UseCase<GetAuthorArticleInput, AuthorArticleDetail> {
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly jobs: AnalysisJobRepository,
    private readonly runs: AnalysisRunRepository,
    private readonly metrics: AnalysisMetricRepository,
    private readonly evidence: AnalysisEvidenceRepository,
    private readonly sources: SourceReferenceRepository,
    private readonly snapshots: ScoreSnapshotRepository,
    private readonly classification: ArticleClassificationService,
  ) {}

  public async execute(input: GetAuthorArticleInput): Promise<AuthorArticleDetail> {
    const actor = await requireArticleAuthor(this.users, input.actorUserId);
    const article = await loadOwnedArticle(this.articles, actor, input.articleId);
    const version = await this.versions.findById(article.currentVersionId);

    if (!version) {
      throw new ArticleNotFoundError(article.id);
    }

    const [taxonomy, history, job, runs] = await Promise.all([
      this.classification.load(article.id),
      this.versions.listByArticleId(article.id),
      this.jobs.findActiveByArticleVersionId(article.currentVersionId),
      this.runs.listByArticleVersionId(article.currentVersionId),
    ]);
    const completedRun = [...runs]
      .reverse()
      .find((run) => run.status === AnalysisRunStatus.COMPLETED);
    const [metrics, evidence, sources, snapshot] = completedRun
      ? await Promise.all([
          this.metrics.listByAnalysisRunId(completedRun.id),
          this.evidence.listByAnalysisRunId(completedRun.id),
          this.sources.listByAnalysisRunId(completedRun.id),
          this.snapshots.findByAnalysisRunId(completedRun.id),
        ])
      : [[], [], [], null] as const;

    return toAuthorArticleDetail({
      article,
      version,
      versions: history,
      categories: taxonomy.categories,
      tags: taxonomy.tags,
      analysisJobStatus: job?.status ?? null,
      contentAnalysis: completedRun
        ? toAuthorContentAnalysis({
            pipelineVersion: completedRun.pipelineVersion,
            metrics,
            evidence,
            sources,
          })
        : null,
      score: toAuthorScoreView(snapshot),
    });
  }
}
