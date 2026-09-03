import {
  AnalysisRunStatus,
  ArticleNotFoundError,
  ArticleStatus,
  asArticleId,
  type AnalysisEvidenceRepository,
  type AnalysisMetricRepository,
  type AnalysisRunRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type ModerationReviewRepository,
  type ProfileRepository,
  type ScoreSnapshotRepository,
  type SourceReferenceRepository,
  type UserRepository,
} from '@aip/domain';
import { requireModerator } from '../moderation-access';
import {
  flagsFromEvidence,
  toAuthorContentAnalysis,
  toModerationArticleDetail,
  type ModerationArticleDetail,
} from '../moderation-views';
import type { UseCase } from '../use-case';

export interface GetModerationArticleInput {
  readonly actorUserId: string;
  readonly articleId: string;
}

export class GetModerationArticleUseCase
  implements UseCase<GetModerationArticleInput, ModerationArticleDetail>
{
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly profiles: ProfileRepository,
    private readonly snapshots: ScoreSnapshotRepository,
    private readonly runs: AnalysisRunRepository,
    private readonly metrics: AnalysisMetricRepository,
    private readonly evidence: AnalysisEvidenceRepository,
    private readonly sources: SourceReferenceRepository,
    private readonly reviews: ModerationReviewRepository,
  ) {}

  public async execute(input: GetModerationArticleInput): Promise<ModerationArticleDetail> {
    await requireModerator(this.users, input.actorUserId);
    const article = await this.articles.findById(asArticleId(input.articleId));

    if (!article || article.status === ArticleStatus.REMOVED) {
      throw new ArticleNotFoundError(input.articleId);
    }

    const version = await this.versions.findById(article.currentVersionId);
    const author = await this.profiles.findByUserId(article.authorId);
    const authorUser = await this.users.findById(article.authorId);

    if (!version || !author || !authorUser) {
      throw new ArticleNotFoundError(input.articleId);
    }

    const [snapshot, runs, reviews] = await Promise.all([
      this.snapshots.findLatestByArticleVersionId(article.currentVersionId),
      this.runs.listByArticleVersionId(article.currentVersionId),
      this.reviews.listByArticleId(article.id),
    ]);
    const completedRun = [...runs].reverse().find((run) => run.status === AnalysisRunStatus.COMPLETED);
    const [metrics, evidence, sources] = completedRun
      ? await Promise.all([
          this.metrics.listByAnalysisRunId(completedRun.id),
          this.evidence.listByAnalysisRunId(completedRun.id),
          this.sources.listByAnalysisRunId(completedRun.id),
        ])
      : [[], [], []];

    return toModerationArticleDetail({
      article,
      version,
      author,
      authorUser,
      snapshot,
      flags: flagsFromEvidence(evidence),
      reviews,
      contentAnalysis: completedRun
        ? toAuthorContentAnalysis({
            pipelineVersion: completedRun.pipelineVersion,
            metrics,
            evidence,
            sources,
          })
        : null,
    });
  }
}
