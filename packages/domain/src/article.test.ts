import { describe, expect, it } from 'vitest';
import { Article } from './article';
import { ArticleVersion } from './article-version';
import { ContentHash } from './content-hash';
import { DomainEventName } from './domain-events';
import { ArticleStatus } from './enums';
import {
  AnalysisNotCompletedError,
  ArticleAlreadyPublishedError,
  InvalidArticleStateError,
} from './errors';
import { asArticleId, asArticleVersionId, asUserId } from './ids';
import { Slug } from './slug';

const NOW = new Date('2026-08-29T10:00:00.000Z');
const LATER = new Date('2026-08-29T11:00:00.000Z');

function hash(char: string): ContentHash {
  return ContentHash.from(char.repeat(64));
}

function createDraft(content = 'Body of the article.') {
  return Article.draft({
    id: asArticleId('article-1'),
    authorId: asUserId('user-1'),
    versionId: asArticleVersionId('version-1'),
    title: 'An Evaluated Article',
    abstract: 'Abstract',
    content,
    contentHash: hash('a'),
    language: 'tr',
    slug: Slug.from('an-evaluated-article'),
    now: NOW,
  });
}

function publishReadyArticle() {
  const draft = createDraft();
  const submitted = draft.article.submit(draft.version, NOW).article;
  const queued = submitted.queueForAnalysis(NOW).article;
  const processing = queued.startProcessing(NOW).article;
  const completed = processing.completeAnalysis(NOW).article;
  const ready = completed.markReadyForPublication(NOW).article;

  return { version: draft.version, ready };
}

describe('Article', () => {
  it('creates a draft bound to version 1', () => {
    const { article, version } = createDraft();

    expect(article.status).toBe(ArticleStatus.DRAFT);
    expect(article.currentVersionNumber).toBe(1);
    expect(article.currentVersionId).toBe(version.id);
    expect(article.publishedAt).toBeNull();
    expect(version.versionNumber).toBe(1);
    expect(article.isOwnedBy(asUserId('user-1'))).toBe(true);
  });

  it('walks the happy path to publication and records domain events', () => {
    const { article: draft, version } = createDraft();
    const submitted = draft.submit(version, NOW);

    expect(submitted.article.status).toBe(ArticleStatus.SUBMITTED);
    expect(submitted.events[0]?.name).toBe(DomainEventName.ArticleSubmitted);

    const published = draft
      .submit(version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.completeAnalysis(NOW)
      .article.markReadyForPublication(NOW)
      .article.publish(LATER);

    expect(published.article.status).toBe(ArticleStatus.PUBLISHED);
    expect(published.article.publishedAt).toEqual(LATER);
    expect(published.events[0]?.name).toBe(DomainEventName.ArticlePublished);
    expect(published.events[0]?.articleVersionId).toBe(version.id);
  });

  it('does not allow publishing before the article is ready', () => {
    const { article, version } = createDraft();
    const submitted = article.submit(version, NOW).article;

    expect(() => submitted.publish(NOW)).toThrow(AnalysisNotCompletedError);
  });

  it('rejects a second submit after publication', () => {
    const { version, ready } = publishReadyArticle();
    const published = ready.publish(LATER).article;

    expect(() => published.submit(version, LATER)).toThrow(ArticleAlreadyPublishedError);
  });

  it('creates a new version and invalidates a published score', () => {
    const { ready } = publishReadyArticle();
    const published = ready.publish(LATER).article;

    const revision = published.revise({
      versionId: asArticleVersionId('version-2'),
      title: 'Revised title',
      abstract: 'Revised abstract',
      content: 'Revised body that must be re-analyzed.',
      contentHash: hash('b'),
      now: LATER,
    });

    expect(revision.version.versionNumber).toBe(2);
    expect(revision.article.status).toBe(ArticleStatus.DRAFT);
    expect(revision.article.currentVersionId).toBe(revision.version.id);
    expect(revision.article.publishedAt).toBeNull();
    expect(revision.article.currentContentHash.equals(hash('b'))).toBe(true);
  });

  it('retries a failed analysis from the same version', () => {
    const { article, version } = createDraft();
    const failed = article
      .submit(version, NOW)
      .article.queueForAnalysis(NOW)
      .article.startProcessing(NOW)
      .article.failAnalysis(NOW).article;

    expect(failed.status).toBe(ArticleStatus.ANALYSIS_FAILED);

    const retried = failed.queueForAnalysis(LATER).article;
    expect(retried.status).toBe(ArticleStatus.QUEUED_FOR_ANALYSIS);
    expect(retried.currentVersionId).toBe(version.id);
  });

  it('rejects submit when the version is not current', () => {
    const { article } = createDraft();
    const otherVersion = ArticleVersion.create({
      id: asArticleVersionId('version-other'),
      articleId: asArticleId('article-1'),
      versionNumber: 1,
      title: 'Other',
      abstract: '',
      content: 'Other body',
      contentHash: hash('c'),
      createdAt: NOW,
    });

    expect(() => article.submit(otherVersion, NOW)).toThrow(InvalidArticleStateError);
  });

  it('rejects submit of empty body', () => {
    const { article, version } = createDraft('');

    expect(() => article.submit(version, NOW)).toThrow(/title and body/);
  });

  it('cannot change a removed article', () => {
    const { article } = createDraft();
    const removed = article.remove(NOW).article;

    expect(removed.status).toBe(ArticleStatus.REMOVED);
    expect(() => removed.archive(LATER)).toThrow(InvalidArticleStateError);
  });
});
