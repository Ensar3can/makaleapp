import {
  AnalysisRunStatus,
  ArticleNotFoundError,
  ArticleStatus,
  type AnalysisEvidence,
  type AnalysisEvidenceRepository,
  type AnalysisRun,
  type AnalysisRunRepository,
  type ArticleRepository,
  type ArticleVersionRepository,
  type ProfileRepository,
  type ScoreSnapshotRepository,
  type UserRepository,
} from '@aip/domain';
import { requireModerator } from '../moderation-access';
import { flagsFromEvidence, toModerationQueueItem, type ModerationQueueItem } from '../moderation-views';
import type { UseCase } from '../use-case';

export interface ListModerationQueueInput {
  readonly actorUserId: string;
}

export class ListModerationQueueUseCase
  implements UseCase<ListModerationQueueInput, readonly ModerationQueueItem[]>
{
  public constructor(
    private readonly users: UserRepository,
    private readonly articles: ArticleRepository,
    private readonly versions: ArticleVersionRepository,
    private readonly profiles: ProfileRepository,
    private readonly snapshots: ScoreSnapshotRepository,
    private readonly runs: AnalysisRunRepository,
    private readonly evidence: AnalysisEvidenceRepository,
  ) {}

  public async execute(input: ListModerationQueueInput): Promise<readonly ModerationQueueItem[]> {
    await requireModerator(this.users, input.actorUserId);
    const queued = await this.articles.listByStatus(ArticleStatus.REQUIRES_REVIEW);

    if (queued.length === 0) {
      return [];
    }

    const versionIds = queued.map((article) => article.currentVersionId);
    const authorIds = queued.map((article) => article.authorId);
    const [versions, authors, snapshots, runs] = await Promise.all([
      this.versions.findManyByIds(versionIds),
      this.profiles.findManyByUserIds(authorIds),
      this.snapshots.findLatestByArticleVersionIds(versionIds),
      this.runs.listByArticleVersionIds(versionIds),
    ]);
    const versionById = new Map(versions.map((version) => [version.id, version]));
    const authorByUserId = new Map(authors.map((author) => [author.userId, author]));
    const snapshotByVersion = new Map(snapshots.map((snapshot) => [snapshot.articleVersionId, snapshot]));
    const runsByVersion = new Map<string, AnalysisRun[]>();

    for (const run of runs) {
      const list = runsByVersion.get(run.articleVersionId) ?? [];
      list.push(run);
      runsByVersion.set(run.articleVersionId, list);
    }

    const completedRunIds = queued.flatMap((article) => {
      const articleRuns = [...(runsByVersion.get(article.currentVersionId) ?? [])].reverse();
      const completed = articleRuns.find((run) => run.status === AnalysisRunStatus.COMPLETED);
      return completed ? [completed.id] : [];
    });
    const evidenceItems = await this.evidence.listByAnalysisRunIds(completedRunIds);
    const evidenceByRun = new Map<string, AnalysisEvidence[]>();

    for (const item of evidenceItems) {
      const list = evidenceByRun.get(item.analysisRunId) ?? [];
      list.push(item);
      evidenceByRun.set(item.analysisRunId, list);
    }

    return queued.flatMap((article) => {
      const version = versionById.get(article.currentVersionId);

      if (!version) {
        throw new ArticleNotFoundError(article.id);
      }

      const author = authorByUserId.get(article.authorId);

      if (!author) {
        return [];
      }

      const articleRuns = [...(runsByVersion.get(article.currentVersionId) ?? [])].reverse();
      const completedRun = articleRuns.find((run) => run.status === AnalysisRunStatus.COMPLETED);

      return [
        toModerationQueueItem({
          article,
          version,
          author,
          snapshot: snapshotByVersion.get(article.currentVersionId) ?? null,
          flags: flagsFromEvidence(completedRun ? (evidenceByRun.get(completedRun.id) ?? []) : []),
        }),
      ];
    });
  }
}
