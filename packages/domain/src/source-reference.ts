import { CitationVerificationStatus, SourceType } from './enums';
import { InvalidSourceReferenceError } from './errors';
import type { AnalysisRunId, ArticleId, SourceReferenceId } from './ids';
import { inspectHttpUrl } from './http-url-safety';
import { Score } from './score';

export interface SourceReferenceProps {
  readonly id: SourceReferenceId;
  readonly articleId: ArticleId;
  readonly analysisRunId: AnalysisRunId;
  readonly url: string;
  readonly title: string;
  readonly publisher: string | null;
  readonly doi: string | null;
  readonly sourceType: SourceType;
  readonly verificationStatus: CitationVerificationStatus;
  readonly reliabilityScore: Score | null;
  readonly createdAt: Date;
}

export class SourceReference {
  public readonly id: SourceReferenceId;
  public readonly articleId: ArticleId;
  public readonly analysisRunId: AnalysisRunId;
  public readonly url: string;
  public readonly title: string;
  public readonly publisher: string | null;
  public readonly doi: string | null;
  public readonly sourceType: SourceType;
  public readonly verificationStatus: CitationVerificationStatus;
  public readonly reliabilityScore: Score | null;
  public readonly createdAt: Date;

  private constructor(props: SourceReferenceProps) {
    this.id = props.id;
    this.articleId = props.articleId;
    this.analysisRunId = props.analysisRunId;
    this.url = props.url;
    this.title = props.title;
    this.publisher = props.publisher;
    this.doi = props.doi;
    this.sourceType = props.sourceType;
    this.verificationStatus = props.verificationStatus;
    this.reliabilityScore = props.reliabilityScore;
    this.createdAt = props.createdAt;
  }

  public static record(props: SourceReferenceProps): SourceReference {
    const url = props.url.trim();
    const title = props.title.trim();
    const publisher = props.publisher?.trim() || null;
    const doi = props.doi?.trim() || null;

    if (url.length === 0) {
      throw new InvalidSourceReferenceError('Source URL is required');
    }

    if (inspectHttpUrl(url).safety === 'invalid') {
      throw new InvalidSourceReferenceError('Source URL is not a valid HTTP(S) URL');
    }

    if (title.length === 0) {
      throw new InvalidSourceReferenceError('Source title is required');
    }

    if (!isSourceType(props.sourceType)) {
      throw new InvalidSourceReferenceError(`Unknown source type: ${props.sourceType}`);
    }

    if (!isCitationVerificationStatus(props.verificationStatus)) {
      throw new InvalidSourceReferenceError(
        `Unknown verification status: ${props.verificationStatus}`,
      );
    }

    return new SourceReference({
      ...props,
      url,
      title,
      publisher,
      doi,
    });
  }

  public static reconstitute(props: SourceReferenceProps): SourceReference {
    return SourceReference.record(props);
  }

  public isBoundTo(analysisRunId: AnalysisRunId): boolean {
    return this.analysisRunId === analysisRunId;
  }
}

function isSourceType(value: string): value is SourceType {
  return Object.values(SourceType).includes(value as SourceType);
}

function isCitationVerificationStatus(value: string): value is CitationVerificationStatus {
  return Object.values(CitationVerificationStatus).includes(value as CitationVerificationStatus);
}
