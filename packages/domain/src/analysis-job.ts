import { assertAnalysisJobTransition } from './analysis-status-machines';
import { AnalysisJobStatus } from './enums';
import { InvalidAnalysisJobStateError } from './errors';
import type { AnalysisJobId, ArticleId, ArticleVersionId } from './ids';

export interface AnalysisJobProps {
  readonly id: AnalysisJobId;
  readonly articleId: ArticleId;
  readonly articleVersionId: ArticleVersionId;
  readonly status: AnalysisJobStatus;
  readonly attemptCount: number;
  readonly queuedAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class AnalysisJob {
  public readonly id: AnalysisJobId;
  public readonly articleId: ArticleId;
  public readonly articleVersionId: ArticleVersionId;
  public readonly status: AnalysisJobStatus;
  public readonly attemptCount: number;
  public readonly queuedAt: Date;
  public readonly startedAt: Date | null;
  public readonly completedAt: Date | null;
  public readonly failureReason: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: AnalysisJobProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.articleVersionId = props.articleVersionId;
    this.status = props.status;
    this.attemptCount = props.attemptCount;
    this.queuedAt = props.queuedAt;
    this.startedAt = props.startedAt;
    this.completedAt = props.completedAt;
    this.failureReason = props.failureReason;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static enqueue(input: {
    id: AnalysisJobId;
    articleId: ArticleId;
    articleVersionId: ArticleVersionId;
    now: Date;
  }): AnalysisJob {
    return new AnalysisJob({
      id: input.id,
      articleId: input.articleId,
      articleVersionId: input.articleVersionId,
      status: AnalysisJobStatus.QUEUED,
      attemptCount: 0,
      queuedAt: input.now,
      startedAt: null,
      completedAt: null,
      failureReason: null,
      createdAt: input.now,
      updatedAt: input.now,
    });
  }

  public static reconstitute(props: AnalysisJobProps): AnalysisJob {
    return new AnalysisJob(props);
  }

  public start(now: Date): AnalysisJob {
    assertAnalysisJobTransition(this.status, AnalysisJobStatus.RUNNING);

    return this.copy({
      status: AnalysisJobStatus.RUNNING,
      attemptCount: this.attemptCount + 1,
      startedAt: now,
      failureReason: null,
      updatedAt: now,
    });
  }

  public complete(now: Date): AnalysisJob {
    assertAnalysisJobTransition(this.status, AnalysisJobStatus.COMPLETED);

    return this.copy({
      status: AnalysisJobStatus.COMPLETED,
      completedAt: now,
      failureReason: null,
      updatedAt: now,
    });
  }

  public fail(reason: string, now: Date): AnalysisJob {
    const trimmed = reason.trim();

    if (trimmed.length === 0) {
      throw new InvalidAnalysisJobStateError('Failure reason is required');
    }

    assertAnalysisJobTransition(this.status, AnalysisJobStatus.FAILED);

    return this.copy({
      status: AnalysisJobStatus.FAILED,
      completedAt: now,
      failureReason: trimmed,
      updatedAt: now,
    });
  }

  public retry(now: Date): AnalysisJob {
    assertAnalysisJobTransition(this.status, AnalysisJobStatus.QUEUED);

    return this.copy({
      status: AnalysisJobStatus.QUEUED,
      queuedAt: now,
      startedAt: null,
      completedAt: null,
      failureReason: null,
      updatedAt: now,
    });
  }

  public cancel(now: Date): AnalysisJob {
    assertAnalysisJobTransition(this.status, AnalysisJobStatus.CANCELLED);

    return this.copy({
      status: AnalysisJobStatus.CANCELLED,
      completedAt: now,
      updatedAt: now,
    });
  }

  public isBoundTo(articleVersionId: ArticleVersionId): boolean {
    return this.articleVersionId === articleVersionId;
  }

  private copy(patch: Partial<AnalysisJobProps>): AnalysisJob {
    return new AnalysisJob({
      id: this.id,
      articleId: this.articleId,
      articleVersionId: this.articleVersionId,
      status: this.status,
      attemptCount: this.attemptCount,
      queuedAt: this.queuedAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      failureReason: this.failureReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...patch,
    });
  }
}
