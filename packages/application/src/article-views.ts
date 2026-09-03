import type {
  AnalysisEvidence,
  AnalysisJobStatus,
  AnalysisMetric,
  Article,
  ArticleType,
  ArticleVersion,
  AuthorshipClassification,
  Category,
  ScoreSnapshot,
  SourceReference,
  Tag,
} from '@aip/domain';
import {
  AnalysisEvidenceType,
  AUTHORSHIP_RISK_DISCLAIMER,
  MetricType,
} from '@aip/domain';

export interface PublicCategory {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface PublicTag {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface AuthorArticleVersionSummary {
  readonly id: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly createdAt: string;
}

export interface AuthorArticleSummary {
  readonly id: string;
  readonly slug: string;
  readonly language: string;
  readonly status: Article['status'];
  readonly title: string;
  readonly abstract: string;
  readonly currentVersionNumber: number;
  readonly updatedAt: string;
  readonly categories: readonly PublicCategory[];
  readonly tags: readonly PublicTag[];
}

export interface AuthorContentMetricView {
  readonly metricType: AnalysisMetric['metricType'];
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface AuthorSourceReferenceView {
  readonly url: string;
  readonly title: string;
  readonly publisher: string | null;
  readonly verificationStatus: string;
  readonly reliabilityScore: number | null;
}

export interface AuthorAuthorshipDetectorView {
  readonly name: string;
  readonly riskScore: number;
  readonly confidenceScore: number;
}

export interface AuthorAuthorshipView {
  readonly riskScore: number;
  readonly confidenceScore: number;
  readonly classification: AuthorshipClassification | null;
  readonly explanation: string;
  readonly disclaimer: string;
  readonly signals: readonly string[];
  readonly detectors: readonly AuthorAuthorshipDetectorView[];
}

export interface AuthorContentAnalysisView {
  readonly articleType: ArticleType | null;
  readonly detectedTopics: readonly string[];
  readonly pipelineVersion: string;
  readonly metrics: readonly AuthorContentMetricView[];
  readonly sources: readonly AuthorSourceReferenceView[];
  readonly authorship: AuthorAuthorshipView | null;
}

export interface AuthorScoreView {
  readonly overallScore: number;
  readonly qualityScore: number;
  readonly authorshipRisk: number;
  readonly authorshipConfidence: number;
  readonly authorshipIntegrity: number;
  readonly authorshipClassification: AuthorshipClassification;
  readonly scoringPolicyVersion: string;
}

export interface AuthorArticleDetail extends AuthorArticleSummary {
  readonly content: string;
  readonly currentVersionId: string;
  readonly versions: readonly AuthorArticleVersionSummary[];
  readonly analysisJobStatus: AnalysisJobStatus | null;
  readonly contentAnalysis: AuthorContentAnalysisView | null;
  readonly score: AuthorScoreView | null;
}

export function toPublicCategory(category: Category): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug.value,
  };
}

export function toPublicTag(tag: Tag): PublicTag {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug.value,
  };
}

export function toAuthorArticleSummary(input: {
  article: Article;
  version: ArticleVersion;
  categories: readonly Category[];
  tags: readonly Tag[];
}): AuthorArticleSummary {
  return {
    id: input.article.id,
    slug: input.article.slug.value,
    language: input.article.language,
    status: input.article.status,
    title: input.version.title,
    abstract: input.version.abstract,
    currentVersionNumber: input.article.currentVersionNumber,
    updatedAt: input.article.updatedAt.toISOString(),
    categories: input.categories.map(toPublicCategory),
    tags: input.tags.map(toPublicTag),
  };
}

export function toAuthorArticleDetail(input: {
  article: Article;
  version: ArticleVersion;
  versions: readonly ArticleVersion[];
  categories: readonly Category[];
  tags: readonly Tag[];
  analysisJobStatus: AnalysisJobStatus | null;
  contentAnalysis?: AuthorContentAnalysisView | null;
  score?: AuthorScoreView | null;
}): AuthorArticleDetail {
  return {
    ...toAuthorArticleSummary(input),
    content: input.version.content,
    currentVersionId: input.article.currentVersionId,
    versions: input.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      title: version.title,
      createdAt: version.createdAt.toISOString(),
    })),
    analysisJobStatus: input.analysisJobStatus,
    contentAnalysis: input.contentAnalysis ?? null,
    score: input.score ?? null,
  };
}

export function toAuthorContentAnalysis(input: {
  pipelineVersion: string;
  metrics: readonly AnalysisMetric[];
  evidence: readonly AnalysisEvidence[];
  sources?: readonly SourceReference[];
}): AuthorContentAnalysisView | null {
  if (input.metrics.length === 0) {
    return null;
  }

  const typeEvidence = input.evidence.find(
    (item) => item.evidenceType === AnalysisEvidenceType.ARTICLE_TYPE,
  );
  const topicEvidence = input.evidence.find(
    (item) => item.evidenceType === AnalysisEvidenceType.DETECTED_TOPICS,
  );

  return {
    articleType: (typeEvidence?.claim as ArticleType | undefined) ?? null,
    detectedTopics: topicEvidence
      ? topicEvidence.evidence.split(',').map((topic) => topic.trim()).filter((topic) => topic.length > 0)
      : [],
    pipelineVersion: input.pipelineVersion,
    metrics: input.metrics
      .filter((metric) => metric.metricType !== MetricType.AI_AUTHORSHIP_RISK)
      .map((metric) => ({
        metricType: metric.metricType,
        score: metric.score.value,
        confidence: metric.confidence.value,
        explanation: metric.explanation,
      })),
    sources: (input.sources ?? []).map((source) => ({
      url: source.url,
      title: source.title,
      publisher: source.publisher,
      verificationStatus: source.verificationStatus,
      reliabilityScore: source.reliabilityScore?.value ?? null,
    })),
    authorship: toAuthorAuthorshipView(input.metrics, input.evidence),
  };
}

export function toAuthorScoreView(snapshot: ScoreSnapshot | null): AuthorScoreView | null {
  if (!snapshot) {
    return null;
  }

  return {
    overallScore: snapshot.overallScore.value,
    qualityScore: snapshot.qualityScore.value,
    authorshipRisk: snapshot.authorshipRisk.value,
    authorshipConfidence: snapshot.authorshipConfidence.value,
    authorshipIntegrity: snapshot.authorshipIntegrity.value,
    authorshipClassification: snapshot.authorshipClassification,
    scoringPolicyVersion: snapshot.scoringPolicyVersion,
  };
}

export function toAuthorAuthorshipView(
  metrics: readonly AnalysisMetric[],
  evidence: readonly AnalysisEvidence[],
): AuthorAuthorshipView | null {
  const metric = metrics.find((item) => item.metricType === MetricType.AI_AUTHORSHIP_RISK);

  if (!metric) {
    return null;
  }

  const classificationClaim = evidence.find(
    (item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_CLASSIFICATION,
  )?.claim;
  const disclaimer = evidence.find(
    (item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER,
  );
  const detectors = evidence.filter(
    (item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_DETECTOR_OUTPUT,
  );
  const signals = evidence.filter((item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_SIGNAL);

  return {
    riskScore: metric.score.value,
    confidenceScore: metric.confidence.value,
    classification: isAuthorshipClassification(classificationClaim) ? classificationClaim : null,
    explanation: metric.explanation,
    disclaimer: disclaimer?.evidence ?? AUTHORSHIP_RISK_DISCLAIMER,
    signals: signals.map((item) => item.claim),
    detectors: detectors.map((item) => ({
      name: item.claim,
      riskScore: item.reliability ?? metric.score.value,
      confidenceScore: parseDetectorConfidence(item.evidence) ?? metric.confidence.value,
    })),
  };
}

function parseDetectorConfidence(evidence: string): number | null {
  const match = /confidence=([\d.]+)/.exec(evidence);
  const value = match ? Number(match[1]) : Number.NaN;
  return Number.isFinite(value) ? value : null;
}

function isAuthorshipClassification(value: string | undefined): value is AuthorshipClassification {
  return (
    value === 'very_low' ||
    value === 'low' ||
    value === 'uncertain' ||
    value === 'elevated' ||
    value === 'high'
  );
}
