import {
  assertArticleStatusTransition,
  STATUSES_INVALIDATED_BY_CONTENT_CHANGE,
} from './article-status-machine';
import { ArticleVersion } from './article-version';
import { ContentHash } from './content-hash';
import {
  articleAnalysisCompleted,
  articleAnalysisRequested,
  articleFlaggedForReview,
  articlePublished,
  articleSubmitted,
  type DomainEvent,
} from './domain-events';
import { ArticleStatus } from './enums';
import {
  AnalysisNotCompletedError,
  ArticleAlreadyPublishedError,
  InvalidArticleStateError,
} from './errors';
import type { ArticleId, ArticleVersionId, UserId } from './ids';
import { Slug } from './slug';

const LANGUAGE_PATTERN = /^[a-z]{2}$/;

export interface ArticleProps {
  readonly id: ArticleId;
  readonly authorId: UserId;
  readonly slug: Slug;
  readonly language: string;
  readonly status: ArticleStatus;
  readonly currentVersionId: ArticleVersionId;
  readonly currentVersionNumber: number;
  readonly currentContentHash: ContentHash;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ArticleDraftInput {
  readonly id: ArticleId;
  readonly authorId: UserId;
  readonly versionId: ArticleVersionId;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: ContentHash;
  readonly language: string;
  readonly slug: Slug;
  readonly now: Date;
}

export interface ArticleRevisionInput {
  readonly versionId: ArticleVersionId;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: ContentHash;
  readonly now: Date;
}

export interface ArticleCommandResult {
  readonly article: Article;
  readonly events: readonly DomainEvent[];
}

export interface ArticleRevisionResult extends ArticleCommandResult {
  readonly version: ArticleVersion;
}

export interface ArticleDraftResult {
  readonly article: Article;
  readonly version: ArticleVersion;
}

export class Article {
  public readonly id: ArticleId;
  public readonly authorId: UserId;
  public readonly slug: Slug;
  public readonly language: string;
  public readonly status: ArticleStatus;
  public readonly currentVersionId: ArticleVersionId;
  public readonly currentVersionNumber: number;
  public readonly currentContentHash: ContentHash;
  public readonly publishedAt: Date | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(props: ArticleProps) {
    this.id = props.id;
    this.authorId = props.authorId;
    this.slug = props.slug;
    this.language = props.language;
    this.status = props.status;
    this.currentVersionId = props.currentVersionId;
    this.currentVersionNumber = props.currentVersionNumber;
    this.currentContentHash = props.currentContentHash;
    this.publishedAt = props.publishedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static draft(input: ArticleDraftInput): ArticleDraftResult {
    const language = assertLanguage(input.language);
    const version = ArticleVersion.create({
      id: input.versionId,
      articleId: input.id,
      versionNumber: 1,
      title: input.title,
      abstract: input.abstract,
      content: input.content,
      contentHash: input.contentHash,
      createdAt: input.now,
    });

    const article = new Article({
      id: input.id,
      authorId: input.authorId,
      slug: input.slug,
      language,
      status: ArticleStatus.DRAFT,
      currentVersionId: version.id,
      currentVersionNumber: version.versionNumber,
      currentContentHash: version.contentHash,
      publishedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    });

    return { article, version };
  }

  public static reconstitute(props: ArticleProps): Article {
    return new Article(props);
  }

  public revise(input: ArticleRevisionInput): ArticleRevisionResult {
    this.assertNotRemoved();

    const version = ArticleVersion.create({
      id: input.versionId,
      articleId: this.id,
      versionNumber: this.currentVersionNumber + 1,
      title: input.title,
      abstract: input.abstract,
      content: input.content,
      contentHash: input.contentHash,
      createdAt: input.now,
    });

    const nextStatus = STATUSES_INVALIDATED_BY_CONTENT_CHANGE.includes(this.status)
      ? ArticleStatus.DRAFT
      : this.status;

    const publishedAt = nextStatus === ArticleStatus.DRAFT ? null : this.publishedAt;

    return {
      article: this.copy({
        status: nextStatus,
        currentVersionId: version.id,
        currentVersionNumber: version.versionNumber,
        currentContentHash: version.contentHash,
        publishedAt,
        updatedAt: input.now,
      }),
      version,
      events: [],
    };
  }

  public submit(currentVersion: ArticleVersion, now: Date): ArticleCommandResult {
    if (this.status === ArticleStatus.PUBLISHED) {
      throw new ArticleAlreadyPublishedError();
    }

    this.assertCurrentVersion(currentVersion);
    this.assertHasSubmittableContent(currentVersion);

    return this.transition(ArticleStatus.SUBMITTED, now, [
      articleSubmitted(this.id, this.currentVersionId, now),
    ]);
  }

  public queueForAnalysis(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.QUEUED_FOR_ANALYSIS, now, [
      articleAnalysisRequested(this.id, this.currentVersionId, now),
    ]);
  }

  public startProcessing(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.PROCESSING, now);
  }

  public completeAnalysis(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.ANALYSIS_COMPLETED, now, [
      articleAnalysisCompleted(this.id, this.currentVersionId, now),
    ]);
  }

  public markReadyForPublication(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.READY_FOR_PUBLICATION, now);
  }

  public requireReview(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.REQUIRES_REVIEW, now, [
      articleFlaggedForReview(this.id, this.currentVersionId, now),
    ]);
  }

  public approveFromReview(now: Date): ArticleCommandResult {
    const ready = this.transition(ArticleStatus.READY_FOR_PUBLICATION, now);

    if (this.publishedAt) {
      return ready.article.publish(now);
    }

    return ready;
  }

  public requestRevision(now: Date): ArticleCommandResult {
    this.assertNotRemoved();
    assertArticleStatusTransition(this.status, ArticleStatus.DRAFT);

    return {
      article: this.copy({
        status: ArticleStatus.DRAFT,
        publishedAt: null,
        updatedAt: now,
      }),
      events: [],
    };
  }

  public reject(now: Date): ArticleCommandResult {
    this.assertNotRemoved();
    assertArticleStatusTransition(this.status, ArticleStatus.REJECTED);

    return {
      article: this.copy({
        status: ArticleStatus.REJECTED,
        publishedAt: null,
        updatedAt: now,
      }),
      events: [],
    };
  }

  public publish(now: Date): ArticleCommandResult {
    if (!this.isEligibleForPublication()) {
      throw new AnalysisNotCompletedError(
        'Article must be ready for publication before it can be published',
      );
    }

    assertArticleStatusTransition(this.status, ArticleStatus.PUBLISHED);

    return {
      article: this.copy({
        status: ArticleStatus.PUBLISHED,
        publishedAt: now,
        updatedAt: now,
      }),
      events: [articlePublished(this.id, this.currentVersionId, now)],
    };
  }

  public failAnalysis(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.ANALYSIS_FAILED, now);
  }

  public returnToDraft(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.DRAFT, now);
  }

  public archive(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.ARCHIVED, now);
  }

  public remove(now: Date): ArticleCommandResult {
    return this.transition(ArticleStatus.REMOVED, now);
  }

  public isEligibleForPublication(): boolean {
    return this.status === ArticleStatus.READY_FOR_PUBLICATION;
  }

  public isOwnedBy(userId: UserId): boolean {
    return this.authorId === userId;
  }

  private transition(
    next: ArticleStatus,
    now: Date,
    events: readonly DomainEvent[] = [],
  ): ArticleCommandResult {
    this.assertNotRemoved();
    assertArticleStatusTransition(this.status, next);

    return {
      article: this.copy({ status: next, updatedAt: now }),
      events,
    };
  }

  private copy(patch: Partial<ArticleProps>): Article {
    return new Article({
      id: this.id,
      authorId: this.authorId,
      slug: this.slug,
      language: this.language,
      status: this.status,
      currentVersionId: this.currentVersionId,
      currentVersionNumber: this.currentVersionNumber,
      currentContentHash: this.currentContentHash,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      ...patch,
    });
  }

  private assertNotRemoved(): void {
    if (this.status === ArticleStatus.REMOVED) {
      throw new InvalidArticleStateError('Removed articles cannot change state');
    }
  }

  private assertCurrentVersion(version: ArticleVersion): void {
    if (version.id !== this.currentVersionId || version.articleId !== this.id) {
      throw new InvalidArticleStateError('Submitted version is not the current article version');
    }
  }

  private assertHasSubmittableContent(version: ArticleVersion): void {
    if (version.title.trim().length === 0 || version.content.trim().length === 0) {
      throw new InvalidArticleStateError('Article must have a title and body before submission');
    }
  }
}

function assertLanguage(language: string): string {
  const normalized = language.trim().toLowerCase();

  if (!LANGUAGE_PATTERN.test(normalized)) {
    throw new InvalidArticleStateError('Language must be a two-letter ISO 639-1 code');
  }

  return normalized;
}
