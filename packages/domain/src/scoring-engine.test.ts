import { describe, expect, it } from 'vitest';
import { AnalysisMetric } from './analysis-metric';
import { AuthorshipClassification, MetricType, REQUIRED_SCORE_METRIC_TYPES } from './enums';
import { IncompleteAnalysisScoreError } from './errors';
import {
  asAnalysisMetricId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asScoreSnapshotId,
} from './ids';
import { Score } from './score';
import { ScoreSnapshot } from './score-snapshot';
import { ScoringEngine } from './scoring-engine';
import { ScoringPolicy } from './scoring-policy';

const NOW = new Date('2026-08-30T15:00:00.000Z');
const RUN = asAnalysisRunId('run-score-1');
const POLICY = ScoringPolicy.initial();
const ENGINE = new ScoringEngine(POLICY);

function metric(
  metricType: MetricType,
  score: number,
  confidence = 80,
  id = `metric-${metricType.toLowerCase()}`,
): AnalysisMetric {
  return AnalysisMetric.record({
    id: asAnalysisMetricId(id),
    analysisRunId: RUN,
    metricType,
    score: Score.from(score),
    confidence: Score.from(confidence),
    explanation: `${metricType} observation for complete scoring.`,
    createdAt: NOW,
  });
}

function completeMetrics(score = 80, authorshipRisk = 20, authorshipConfidence = 80): AnalysisMetric[] {
  return [
    metric(MetricType.STRUCTURE, score),
    metric(MetricType.CONTENT_QUALITY, score),
    metric(MetricType.TOPIC_RELEVANCE, score),
    metric(MetricType.CITATION_QUALITY, score),
    metric(MetricType.EVIDENCE, score),
    metric(MetricType.FACTUAL_RELIABILITY, score),
    metric(MetricType.ORIGINALITY, score),
    metric(MetricType.AI_AUTHORSHIP_RISK, authorshipRisk, authorshipConfidence),
  ];
}

describe('ScoringEngine', () => {
  it('requires every quality metric plus authorship risk', () => {
    expect(REQUIRED_SCORE_METRIC_TYPES).toEqual([
      MetricType.STRUCTURE,
      MetricType.CONTENT_QUALITY,
      MetricType.TOPIC_RELEVANCE,
      MetricType.CITATION_QUALITY,
      MetricType.EVIDENCE,
      MetricType.FACTUAL_RELIABILITY,
      MetricType.ORIGINALITY,
      MetricType.AI_AUTHORSHIP_RISK,
    ]);
  });

  it('fails closed when a required metric is missing', () => {
    const missingOriginality = completeMetrics().filter((item) => item.metricType !== MetricType.ORIGINALITY);

    expect(() => ENGINE.evaluate(missingOriginality)).toThrow(IncompleteAnalysisScoreError);
    expect(() => ENGINE.evaluate(missingOriginality)).toThrow(/ORIGINALITY/);
  });

  it('fails closed when authorship risk is missing', () => {
    const missingAuthorship = completeMetrics().filter(
      (item) => item.metricType !== MetricType.AI_AUTHORSHIP_RISK,
    );

    expect(() => ENGINE.evaluate(missingAuthorship)).toThrow(/AI_AUTHORSHIP_RISK/);
  });

  it('fails closed on duplicate metric types', () => {
    const duplicated = [...completeMetrics(), metric(MetricType.STRUCTURE, 10, 80, 'metric-structure-dup')];

    expect(() => ENGINE.evaluate(duplicated)).toThrow(/Duplicate STRUCTURE/);
  });

  it('is independent of metric order', () => {
    const reversed = [...completeMetrics(80, 20, 80)].reverse();
    const forward = ENGINE.evaluate(completeMetrics(80, 20, 80));
    const backward = ENGINE.evaluate(reversed);

    expect(backward).toEqual(forward);
  });

  it('does not let zero-confidence authorship change the overall score', () => {
    const computed = ENGINE.evaluate(completeMetrics(80, 100, 0));

    expect(computed.qualityScore.value).toBe(80);
    expect(computed.authorshipRisk.value).toBe(100);
    expect(computed.authorshipIntegrity.value).toBe(0);
    expect(computed.effectiveAuthorshipWeight).toBe(0);
    expect(computed.overallScore.value).toBe(80);
    expect(computed.scoringPolicyVersion).toBe('v1');
  });

  it('applies the full authorship mix when confidence meets the threshold', () => {
    const computed = ENGINE.evaluate(completeMetrics(80, 100, 100));

    expect(computed.effectiveAuthorshipWeight).toBeCloseTo(0.15);
    expect(computed.overallScore.value).toBe(68);
    expect(computed.authorshipClassification).toBe(AuthorshipClassification.HIGH);
  });

  it('scales authorship weight below the confidence threshold', () => {
    const computed = ENGINE.evaluate(completeMetrics(80, 100, 30));

    expect(computed.effectiveAuthorshipWeight).toBeCloseTo(0.075);
    expect(computed.overallScore.value).toBe(74);
  });

  it('weights originality at 10 percent of quality', () => {
    const metrics = completeMetrics(0).map((item) =>
      item.metricType === MetricType.ORIGINALITY ? metric(MetricType.ORIGINALITY, 100) : item,
    );
    const computed = ENGINE.evaluate(metrics);

    expect(computed.qualityScore.value).toBe(10);
  });

  it('produces a full overall score when quality is full and authorship risk is zero', () => {
    const computed = ENGINE.evaluate(completeMetrics(100, 0, 100));

    expect(computed.qualityScore.value).toBe(100);
    expect(computed.authorshipIntegrity.value).toBe(100);
    expect(computed.overallScore.value).toBe(100);
    expect(computed.authorshipClassification).toBe(AuthorshipClassification.VERY_LOW);
  });

  it('keeps extreme zeros inside the score bounds', () => {
    const computed = ENGINE.evaluate(completeMetrics(0, 100, 100));

    expect(computed.qualityScore.value).toBe(0);
    expect(computed.overallScore.value).toBe(0);
    expect(computed.overallScore.value).toBeGreaterThanOrEqual(0);
    expect(computed.overallScore.value).toBeLessThanOrEqual(100);
  });

  it('classifies authorship as a risk band, never a binary verdict', () => {
    const elevated = ENGINE.evaluate(completeMetrics(70, 75, 90));

    expect(elevated.authorshipClassification).toBe(AuthorshipClassification.ELEVATED);
    expect(elevated.authorshipClassification).not.toBe('AI_WRITTEN');
    expect(Object.values(AuthorshipClassification)).toContain(elevated.authorshipClassification);
  });

  it('captures a snapshot bound to the article version and policy version', () => {
    const computed = ENGINE.evaluate(completeMetrics(82, 18, 88));
    const snapshot = ScoreSnapshot.fromComputed({
      id: asScoreSnapshotId('snap-1'),
      articleId: asArticleId('article-1'),
      articleVersionId: asArticleVersionId('version-1'),
      analysisRunId: RUN,
      computed,
      createdAt: NOW,
    });

    expect(snapshot.isBoundTo(asArticleVersionId('version-1'))).toBe(true);
    expect(snapshot.isBoundTo(asArticleVersionId('version-2'))).toBe(false);
    expect(snapshot.scoringPolicyVersion).toBe('v1');
    expect(snapshot.overallScore.value).toBe(computed.overallScore.value);
    expect(snapshot.qualityScore.value).toBe(computed.qualityScore.value);
    expect(snapshot.analysisRunId).toBe(RUN);
  });
});
