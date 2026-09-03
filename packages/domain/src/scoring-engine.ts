import type { AnalysisMetric } from './analysis-metric';
import { MetricType, REQUIRED_SCORE_METRIC_TYPES, type RequiredScoreMetricType } from './enums';
import { IncompleteAnalysisScoreError } from './errors';
import { ScoringPolicy, type ComputedArticleScore, type QualityMetricScores } from './scoring-policy';

export class ScoringEngine {
  public constructor(private readonly policy: ScoringPolicy) {}

  public evaluate(metrics: readonly AnalysisMetric[]): ComputedArticleScore {
    const byType = indexRequiredMetrics(metrics);

    return this.policy.evaluate({
      metrics: qualityScores(byType),
      authorshipRisk: byType[MetricType.AI_AUTHORSHIP_RISK].score,
      authorshipConfidence: byType[MetricType.AI_AUTHORSHIP_RISK].confidence,
    });
  }
}

type IndexedScoreMetrics = Record<RequiredScoreMetricType, AnalysisMetric>;

function indexRequiredMetrics(metrics: readonly AnalysisMetric[]): IndexedScoreMetrics {
  const seen = new Map<MetricType, AnalysisMetric>();

  for (const metric of metrics) {
    if (!isRequiredScoreMetric(metric.metricType)) {
      continue;
    }

    if (seen.has(metric.metricType)) {
      throw new IncompleteAnalysisScoreError(
        `Duplicate ${metric.metricType} metric cannot produce a complete score`,
      );
    }

    seen.set(metric.metricType, metric);
  }

  const missing = REQUIRED_SCORE_METRIC_TYPES.filter((metricType) => !seen.has(metricType));

  if (missing.length > 0) {
    throw new IncompleteAnalysisScoreError(
      `Complete score requires metrics: ${missing.join(', ')}`,
    );
  }

  return Object.fromEntries(
    REQUIRED_SCORE_METRIC_TYPES.map((metricType) => [metricType, seen.get(metricType)!]),
  ) as IndexedScoreMetrics;
}

function qualityScores(byType: IndexedScoreMetrics): QualityMetricScores {
  return {
    structure: byType[MetricType.STRUCTURE].score,
    contentQuality: byType[MetricType.CONTENT_QUALITY].score,
    topicRelevance: byType[MetricType.TOPIC_RELEVANCE].score,
    citationQuality: byType[MetricType.CITATION_QUALITY].score,
    evidence: byType[MetricType.EVIDENCE].score,
    factualReliability: byType[MetricType.FACTUAL_RELIABILITY].score,
    originality: byType[MetricType.ORIGINALITY].score,
  };
}

function isRequiredScoreMetric(metricType: MetricType): metricType is RequiredScoreMetricType {
  return (REQUIRED_SCORE_METRIC_TYPES as readonly MetricType[]).includes(metricType);
}
