import type { AuthorshipClassification } from './enums';
import { InvalidScoreSnapshotError } from './errors';
import type { AnalysisRunId, ArticleId, ArticleVersionId, ScoreSnapshotId } from './ids';
import type { Score } from './score';
import type { ComputedArticleScore } from './scoring-policy';

export interface ScoreSnapshotProps {
  readonly id: ScoreSnapshotId;
  readonly articleId: ArticleId;
  readonly articleVersionId: ArticleVersionId;
  readonly analysisRunId: AnalysisRunId;
  readonly qualityScore: Score;
  readonly authorshipRisk: Score;
  readonly authorshipConfidence: Score;
  readonly authorshipIntegrity: Score;
  readonly authorshipClassification: AuthorshipClassification;
  readonly overallScore: Score;
  readonly scoringPolicyVersion: string;
  readonly createdAt: Date;
}

export class ScoreSnapshot {
  public readonly id: ScoreSnapshotId;
  public readonly articleId: ArticleId;
  public readonly articleVersionId: ArticleVersionId;
  public readonly analysisRunId: AnalysisRunId;
  public readonly qualityScore: Score;
  public readonly authorshipRisk: Score;
  public readonly authorshipConfidence: Score;
  public readonly authorshipIntegrity: Score;
  public readonly authorshipClassification: AuthorshipClassification;
  public readonly overallScore: Score;
  public readonly scoringPolicyVersion: string;
  public readonly createdAt: Date;

  private constructor(props: ScoreSnapshotProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.articleVersionId = props.articleVersionId;
    this.analysisRunId = props.analysisRunId;
    this.qualityScore = props.qualityScore;
    this.authorshipRisk = props.authorshipRisk;
    this.authorshipConfidence = props.authorshipConfidence;
    this.authorshipIntegrity = props.authorshipIntegrity;
    this.authorshipClassification = props.authorshipClassification;
    this.overallScore = props.overallScore;
    this.scoringPolicyVersion = props.scoringPolicyVersion;
    this.createdAt = props.createdAt;
  }

  public static capture(props: ScoreSnapshotProps): ScoreSnapshot {
    if (props.scoringPolicyVersion.trim().length === 0) {
      throw new InvalidScoreSnapshotError('Score snapshot requires a scoring policy version');
    }

    return new ScoreSnapshot(props);
  }

  public static fromComputed(input: {
    readonly id: ScoreSnapshotId;
    readonly articleId: ArticleId;
    readonly articleVersionId: ArticleVersionId;
    readonly analysisRunId: AnalysisRunId;
    readonly computed: ComputedArticleScore;
    readonly createdAt: Date;
  }): ScoreSnapshot {
    return ScoreSnapshot.capture({
      id: input.id,
      articleId: input.articleId,
      articleVersionId: input.articleVersionId,
      analysisRunId: input.analysisRunId,
      qualityScore: input.computed.qualityScore,
      authorshipRisk: input.computed.authorshipRisk,
      authorshipConfidence: input.computed.authorshipConfidence,
      authorshipIntegrity: input.computed.authorshipIntegrity,
      authorshipClassification: input.computed.authorshipClassification,
      overallScore: input.computed.overallScore,
      scoringPolicyVersion: input.computed.scoringPolicyVersion,
      createdAt: input.createdAt,
    });
  }

  public static reconstitute(props: ScoreSnapshotProps): ScoreSnapshot {
    return new ScoreSnapshot(props);
  }

  public isBoundTo(articleVersionId: ArticleVersionId): boolean {
    return this.articleVersionId === articleVersionId;
  }
}
