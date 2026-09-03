import { ModerationDecision } from './enums';
import { InvalidModerationReviewError } from './errors';
import type { ArticleId, ArticleVersionId, ModerationReviewId, UserId } from './ids';

const REASON_MIN = 8;
const REASON_MAX = 2000;
const NOTES_MAX = 8000;

export interface ModerationReviewProps {
  readonly id: ModerationReviewId;
  readonly articleId: ArticleId;
  readonly articleVersionId: ArticleVersionId;
  readonly moderatorId: UserId;
  readonly decision: ModerationDecision;
  readonly reason: string;
  readonly notes: string;
  readonly createdAt: Date;
}

export class ModerationReview {
  public readonly id: ModerationReviewId;
  public readonly articleId: ArticleId;
  public readonly articleVersionId: ArticleVersionId;
  public readonly moderatorId: UserId;
  public readonly decision: ModerationDecision;
  public readonly reason: string;
  public readonly notes: string;
  public readonly createdAt: Date;

  private constructor(props: ModerationReviewProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.articleVersionId = props.articleVersionId;
    this.moderatorId = props.moderatorId;
    this.decision = props.decision;
    this.reason = props.reason;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
  }

  public static record(props: ModerationReviewProps): ModerationReview {
    if (!isModerationDecision(props.decision)) {
      throw new InvalidModerationReviewError('Moderation decision is invalid');
    }

    const reason = props.reason.trim();
    const notes = props.notes.trim();

    if (reason.length < REASON_MIN || reason.length > REASON_MAX) {
      throw new InvalidModerationReviewError(
        `Moderation reason must be between ${REASON_MIN} and ${REASON_MAX} characters`,
      );
    }

    if (notes.length > NOTES_MAX) {
      throw new InvalidModerationReviewError(`Moderation notes must be at most ${NOTES_MAX} characters`);
    }

    return new ModerationReview({
      ...props,
      reason,
      notes,
    });
  }

  public static reconstitute(props: ModerationReviewProps): ModerationReview {
    return ModerationReview.record(props);
  }

  public isBoundTo(articleVersionId: ArticleVersionId): boolean {
    return this.articleVersionId === articleVersionId;
  }
}

export function isModerationDecision(value: string): value is ModerationDecision {
  return (
    value === ModerationDecision.APPROVE ||
    value === ModerationDecision.REQUEST_REVISION ||
    value === ModerationDecision.REJECT
  );
}
