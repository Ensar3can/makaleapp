import { assertAnalysisRunTransition } from './analysis-status-machines';
import { AnalysisRunStatus } from './enums';
import { InvalidAnalysisRunStateError } from './errors';
import type { AnalysisRunId, ArticleId, ArticleVersionId } from './ids';

export interface AnalysisRunProps {
  readonly id: AnalysisRunId;
  readonly articleId: ArticleId;
  readonly articleVersionId: ArticleVersionId;
  readonly status: AnalysisRunStatus;
  readonly pipelineVersion: string;
  readonly promptVersion: string;
  readonly modelProvider: string;
  readonly modelName: string;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly tokenUsage: number | null;
  readonly estimatedCost: number | null;
  readonly createdAt: Date;
}

export class AnalysisRun {
  public readonly id: AnalysisRunId;
  public readonly articleId: ArticleId;
  public readonly articleVersionId: ArticleVersionId;
  public readonly status: AnalysisRunStatus;
  public readonly pipelineVersion: string;
  public readonly promptVersion: string;
  public readonly modelProvider: string;
  public readonly modelName: string;
  public readonly startedAt: Date | null;
  public readonly completedAt: Date | null;
  public readonly tokenUsage: number | null;
  public readonly estimatedCost: number | null;
  public readonly createdAt: Date;

  private constructor(props: AnalysisRunProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.articleVersionId = props.articleVersionId;
    this.status = props.status;
    this.pipelineVersion = props.pipelineVersion;
    this.promptVersion = props.promptVersion;
    this.modelProvider = props.modelProvider;
    this.modelName = props.modelName;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.tokenUsage = props.tokenUsage;
    this.estimatedCost = props.estimatedCost;
    this.createdAt = props.createdAt;
  }

  public static start(input: {
    id: AnalysisRunId;
    articleId: ArticleId;
    articleVersionId: ArticleVersionId;
    pipelineVersion: string;
    promptVersion: string;
    modelProvider: string;
    modelName: string;
    now: Date;
  }): AnalysisRun {
    assertRequiredVersion(input.pipelineVersion, 'Pipeline version');
    assertRequiredVersion(input.promptVersion, 'Prompt version');
    assertRequiredVersion(input.modelProvider, 'Model provider');
    assertRequiredVersion(input.modelName, 'Model name');

    return new AnalysisRun({
      id: input.id,
      articleId: input.articleId,
      articleVersionId: input.articleVersionId,
      status: AnalysisRunStatus.RUNNING,
      pipelineVersion: input.pipelineVersion.trim(),
      promptVersion: input.promptVersion.trim(),
      modelProvider: input.modelProvider.trim(),
      modelName: input.modelName.trim(),
      startedAt: input.now,
      completedAt: null,
      tokenUsage: null,
      estimatedCost: null,
      createdAt: input.now,
    });
  }

  public static reconstitute(props: AnalysisRunProps): AnalysisRun {
    return new AnalysisRun(props);
  }

  public complete(input: { tokenUsage: number; estimatedCost: number; now: Date }): AnalysisRun {
    if (!Number.isFinite(input.tokenUsage) || input.tokenUsage < 0) {
      throw new InvalidAnalysisRunStateError('Token usage must be a non-negative number');
    }

    if (!Number.isFinite(input.estimatedCost) || input.estimatedCost < 0) {
      throw new InvalidAnalysisRunStateError('Estimated cost must be a non-negative number');
    }

    assertAnalysisRunTransition(this.status, AnalysisRunStatus.COMPLETED);

    return this.copy({
      status: AnalysisRunStatus.COMPLETED,
      completedAt: input.now,
      tokenUsage: input.tokenUsage,
      estimatedCost: input.estimatedCost,
    });
  }

  public fail(now: Date): AnalysisRun {
    assertAnalysisRunTransition(this.status, AnalysisRunStatus.FAILED);

    return this.copy({
      status: AnalysisRunStatus.FAILED,
      completedAt: now,
    });
  }

  public isBoundTo(articleVersionId: ArticleVersionId): boolean {
    return this.articleVersionId === articleVersionId;
  }

  private copy(patch: Partial<AnalysisRunProps>): AnalysisRun {
    return new AnalysisRun({
      id: this.id,
      articleId: this.articleId,
      articleVersionId: this.articleVersionId,
      status: this.status,
      pipelineVersion: this.pipelineVersion,
      promptVersion: this.promptVersion,
      modelProvider: this.modelProvider,
      modelName: this.modelName,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      tokenUsage: this.tokenUsage,
      estimatedCost: this.estimatedCost,
      createdAt: this.createdAt,
      ...patch,
    });
  }
}

function assertRequiredVersion(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new InvalidAnalysisRunStateError(`${label} is required`);
  }
}
