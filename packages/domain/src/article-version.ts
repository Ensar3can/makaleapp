import { ContentHash } from './content-hash';
import { InvalidArticleVersionError } from './errors';
import type { ArticleId, ArticleVersionId } from './ids';

const TITLE_MAX = 200;
const ABSTRACT_MAX = 2000;
const CONTENT_MAX = 200_000;

export interface ArticleVersionProps {
  readonly id: ArticleVersionId;
  readonly articleId: ArticleId;
  readonly versionNumber: number;
  readonly title: string;
  readonly abstract: string;
  readonly content: string;
  readonly contentHash: ContentHash;
  readonly createdAt: Date;
}

export class ArticleVersion {
  public readonly id: ArticleVersionId;
  public readonly articleId: ArticleId;
  public readonly versionNumber: number;
  public readonly title: string;
  public readonly abstract: string;
  public readonly content: string;
  public readonly contentHash: ContentHash;
  public readonly createdAt: Date;

  private constructor(props: ArticleVersionProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.versionNumber = props.versionNumber;
    this.title = props.title;
    this.abstract = props.abstract;
    this.content = props.content;
    this.contentHash = props.contentHash;
    this.createdAt = props.createdAt;
  }

  public static create(input: {
    id: ArticleVersionId;
    articleId: ArticleId;
    versionNumber: number;
    title: string;
    abstract: string;
    content: string;
    contentHash: ContentHash;
    createdAt: Date;
  }): ArticleVersion {
    if (!Number.isInteger(input.versionNumber) || input.versionNumber < 1) {
      throw new InvalidArticleVersionError('Version number must be an integer greater than 0');
    }

    return new ArticleVersion({
      ...input,
      title: assertTitle(input.title),
      abstract: assertAbstract(input.abstract),
      content: assertContent(input.content),
    });
  }

  public static reconstitute(props: ArticleVersionProps): ArticleVersion {
    return new ArticleVersion(props);
  }
}

export function assertTitle(title: string): string {
  const trimmed = title.trim();

  if (trimmed.length === 0 || trimmed.length > TITLE_MAX) {
    throw new InvalidArticleVersionError(`Title must be between 1 and ${TITLE_MAX} characters`);
  }

  return trimmed;
}

export function assertAbstract(abstract: string): string {
  const trimmed = abstract.trim();

  if (trimmed.length > ABSTRACT_MAX) {
    throw new InvalidArticleVersionError(`Abstract must be at most ${ABSTRACT_MAX} characters`);
  }

  return trimmed;
}

export function assertContent(content: string): string {
  if (content.length > CONTENT_MAX) {
    throw new InvalidArticleVersionError(`Content must be at most ${CONTENT_MAX} characters`);
  }

  return content;
}
