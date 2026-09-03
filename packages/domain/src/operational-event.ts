import { OperationalEventKind, isOperationalEventKind } from './enums';
import { InvalidOperationalEventError } from './errors';
import type { AnalysisJobId, AnalysisRunId, ArticleId, OperationalEventId, UserId } from './ids';

const REQUEST_ID_MAX = 64;
const STATUS_MAX = 64;
const MESSAGE_MAX = 500;

const SECRET_HINT = /(password|token|secret|authorization|cookie|api[_-]?key|session_pepper)/i;

export interface OperationalEventProps {
  readonly id: OperationalEventId;
  readonly kind: OperationalEventKind;
  readonly requestId: string | null;
  readonly userId: UserId | null;
  readonly articleId: ArticleId | null;
  readonly analysisRunId: AnalysisRunId | null;
  readonly jobId: AnalysisJobId | null;
  readonly durationMs: number | null;
  readonly status: string;
  readonly message: string;
  readonly createdAt: Date;
}

export class OperationalEvent {
  public readonly id: OperationalEventId;
  public readonly kind: OperationalEventKind;
  public readonly requestId: string | null;
  public readonly userId: UserId | null;
  public readonly articleId: ArticleId | null;
  public readonly analysisRunId: AnalysisRunId | null;
  public readonly jobId: AnalysisJobId | null;
  public readonly durationMs: number | null;
  public readonly status: string;
  public readonly message: string;
  public readonly createdAt: Date;

  private constructor(props: OperationalEventProps) {
    this.id = props.id;
    this.kind = props.kind;
    this.requestId = props.requestId;
    this.userId = props.userId;
    this.articleId = props.articleId;
    this.analysisRunId = props.analysisRunId;
    this.jobId = props.jobId;
    this.durationMs = props.durationMs;
    this.status = props.status;
    this.message = props.message;
    this.createdAt = props.createdAt;
  }

  public static record(input: {
    readonly id: OperationalEventId;
    readonly kind: string;
    readonly requestId?: string | null;
    readonly userId?: UserId | null;
    readonly articleId?: ArticleId | null;
    readonly analysisRunId?: AnalysisRunId | null;
    readonly jobId?: AnalysisJobId | null;
    readonly durationMs?: number | null;
    readonly status: string;
    readonly message: string;
    readonly createdAt: Date;
  }): OperationalEvent {
    if (!isOperationalEventKind(input.kind)) {
      throw new InvalidOperationalEventError('Operational event kind is invalid');
    }

    const status = input.status.trim();
    const message = sanitizeOperationalMessage(input.message);
    const requestId = normalizeOptionalText(input.requestId, REQUEST_ID_MAX, 'Request id');

    if (status.length === 0 || status.length > STATUS_MAX) {
      throw new InvalidOperationalEventError('Status is required');
    }

    if (input.durationMs !== null && input.durationMs !== undefined) {
      if (!Number.isInteger(input.durationMs) || input.durationMs < 0) {
        throw new InvalidOperationalEventError('Duration must be a non-negative integer');
      }
    }

    return new OperationalEvent({
      id: input.id,
      kind: input.kind,
      requestId,
      userId: input.userId ?? null,
      articleId: input.articleId ?? null,
      analysisRunId: input.analysisRunId ?? null,
      jobId: input.jobId ?? null,
      durationMs: input.durationMs ?? null,
      status,
      message,
      createdAt: input.createdAt,
    });
  }

  public static reconstitute(props: OperationalEventProps): OperationalEvent {
    return OperationalEvent.record(props);
  }
}

export function sanitizeOperationalMessage(value: string): string {
  const trimmed = value.replace(/\s+/g, ' ').trim();

  if (trimmed.length === 0) {
    throw new InvalidOperationalEventError('Message is required');
  }

  if (SECRET_HINT.test(trimmed)) {
    return '[redacted]';
  }

  return trimmed.slice(0, MESSAGE_MAX);
}

function normalizeOptionalText(
  value: string | null | undefined,
  max: number,
  label: string,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > max) {
    throw new InvalidOperationalEventError(`${label} is too long`);
  }

  return trimmed;
}
