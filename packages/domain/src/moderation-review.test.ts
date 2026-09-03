import { describe, expect, it } from 'vitest';
import { AuditLog } from './audit-log';
import { AuditAction, ModerationDecision } from './enums';
import { InvalidAuditLogError, InvalidModerationReviewError } from './errors';
import { asArticleId, asArticleVersionId, asAuditLogId, asModerationReviewId, asUserId } from './ids';
import { ModerationReview } from './moderation-review';

const NOW = new Date('2026-08-30T16:00:00.000Z');

describe('ModerationReview', () => {
  it('records an approve decision bound to the article version', () => {
    const review = ModerationReview.record({
      id: asModerationReviewId('review-1'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      moderatorId: asUserId('mod-1'),
      decision: ModerationDecision.APPROVE,
      reason: 'Scores and evidence are consistent.',
      notes: 'No citation issues.',
      createdAt: NOW,
    });

    expect(review.isBoundTo(asArticleVersionId('version-1'))).toBe(true);
    expect(review.decision).toBe(ModerationDecision.APPROVE);
  });

  it('rejects a blank reason', () => {
    expect(() =>
      ModerationReview.record({
        id: asModerationReviewId('review-2'),
        articleId: asArticleId('article-1'),
        articleVersionId: asArticleVersionId('version-1'),
        moderatorId: asUserId('mod-1'),
        decision: ModerationDecision.REJECT,
        reason: 'short',
        notes: '',
        createdAt: NOW,
      }),
    ).toThrow(InvalidModerationReviewError);
  });
});

describe('AuditLog', () => {
  it('records a system flag with JSON metadata', () => {
    const entry = AuditLog.record({
      id: asAuditLogId('audit-1'),
      actorUserId: null,
      action: AuditAction.ARTICLE_FLAGGED,
      entityType: 'Article',
      entityId: 'article-1',
      metadata: JSON.stringify({ flags: [AuditAction.ARTICLE_FLAGGED] }),
      ipHash: null,
      createdAt: NOW,
    });

    expect(entry.isSystemAction()).toBe(true);
    expect(entry.isAction(AuditAction.ARTICLE_FLAGGED)).toBe(true);
  });

  it('rejects non-object metadata', () => {
    expect(() =>
      AuditLog.record({
        id: asAuditLogId('audit-2'),
        actorUserId: asUserId('mod-1'),
        action: AuditAction.ARTICLE_MODERATED,
        entityType: 'Article',
        entityId: 'article-1',
        metadata: '[]',
        ipHash: null,
        createdAt: NOW,
      }),
    ).toThrow(InvalidAuditLogError);
  });
});
