import { describe, expect, it } from 'vitest';
import {
  AnalysisEvidence,
  AnalysisEvidenceType,
  AnalysisMetric,
  AUTHORSHIP_RISK_DISCLAIMER,
  AuthorshipClassification,
  MetricType,
  Score,
  ScoreSnapshot,
  ScoringPolicy,
  asAnalysisEvidenceId,
  asAnalysisMetricId,
  asAnalysisRunId,
  asArticleId,
  asArticleVersionId,
  asScoreSnapshotId,
} from '@aip/domain';
import { toAuthorContentAnalysis, toAuthorScoreView } from './article-views';

const NOW = new Date('2026-08-30T16:30:00.000Z');
const RUN = asAnalysisRunId('run-authorship-1');

describe('toAuthorContentAnalysis', () => {
  it('maps persisted authorship evidence without calculating a score', () => {
    const view = toAuthorContentAnalysis({
      pipelineVersion: 'analysis-pipeline-authorship-1',
      metrics: [
        AnalysisMetric.record({
          id: asAnalysisMetricId('metric-structure'),
          analysisRunId: RUN,
          metricType: MetricType.STRUCTURE,
          score: Score.from(74),
          confidence: Score.from(70),
          explanation: 'Meets the technical structure policy.',
          createdAt: NOW,
        }),
        AnalysisMetric.record({
          id: asAnalysisMetricId('metric-authorship'),
          analysisRunId: RUN,
          metricType: MetricType.AI_AUTHORSHIP_RISK,
          score: Score.from(61),
          confidence: Score.from(41),
          explanation: 'Ensemble produced a risk estimate, not a verdict.',
          createdAt: NOW,
        }),
      ],
      evidence: [
        AnalysisEvidence.record({
          id: asAnalysisEvidenceId('ev-type'),
          analysisRunId: RUN,
          metricType: MetricType.STRUCTURE,
          evidenceType: AnalysisEvidenceType.ARTICLE_TYPE,
          claim: 'technical',
          evidence: 'Methods language.',
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
          createdAt: NOW,
        }),
        AnalysisEvidence.record({
          id: asAnalysisEvidenceId('ev-disclaimer'),
          analysisRunId: RUN,
          metricType: MetricType.AI_AUTHORSHIP_RISK,
          evidenceType: AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER,
          claim: 'AI authorship risk',
          evidence: AUTHORSHIP_RISK_DISCLAIMER,
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
          createdAt: NOW,
        }),
        AnalysisEvidence.record({
          id: asAnalysisEvidenceId('ev-class'),
          analysisRunId: RUN,
          metricType: MetricType.AI_AUTHORSHIP_RISK,
          evidenceType: AnalysisEvidenceType.AUTHORSHIP_CLASSIFICATION,
          claim: AuthorshipClassification.ELEVATED,
          evidence: 'Risk band elevated. Not a verdict.',
          sourceUrl: null,
          sourceTitle: null,
          reliability: null,
          createdAt: NOW,
        }),
        AnalysisEvidence.record({
          id: asAnalysisEvidenceId('ev-detector'),
          analysisRunId: RUN,
          metricType: MetricType.AI_AUTHORSHIP_RISK,
          evidenceType: AnalysisEvidenceType.AUTHORSHIP_DETECTOR_OUTPUT,
          claim: 'stylometric',
          evidence: 'risk=70;confidence=60;version=stylometric-authorship-1;model=none.',
          sourceUrl: null,
          sourceTitle: 'stylometric-authorship-1',
          reliability: 70,
          createdAt: NOW,
        }),
      ],
    });

    expect(view?.metrics.map((metric) => metric.metricType)).toEqual([MetricType.STRUCTURE]);
    expect(view?.authorship).toEqual({
      riskScore: 61,
      confidenceScore: 41,
      classification: AuthorshipClassification.ELEVATED,
      explanation: 'Ensemble produced a risk estimate, not a verdict.',
      disclaimer: AUTHORSHIP_RISK_DISCLAIMER,
      signals: [],
      detectors: [{ name: 'stylometric', riskScore: 70, confidenceScore: 60 }],
    });
    expect(view).not.toHaveProperty('overallScore');
  });
});

describe('toAuthorScoreView', () => {
  it('maps a persisted snapshot without recalculating the mix', () => {
    const computed = ScoringPolicy.initial().evaluate({
      metrics: {
        structure: Score.from(80),
        contentQuality: Score.from(80),
        topicRelevance: Score.from(80),
        citationQuality: Score.from(80),
        evidence: Score.from(80),
        factualReliability: Score.from(80),
        originality: Score.from(80),
      },
      authorshipRisk: Score.from(20),
      authorshipConfidence: Score.from(80),
    });
    const view = toAuthorScoreView(
      ScoreSnapshot.fromComputed({
        id: asScoreSnapshotId('snap-1'),
        articleId: asArticleId('article-1'),
        articleVersionId: asArticleVersionId('version-1'),
        analysisRunId: RUN,
        computed,
        createdAt: NOW,
      }),
    );

    expect(view).toEqual({
      overallScore: computed.overallScore.value,
      qualityScore: computed.qualityScore.value,
      authorshipRisk: computed.authorshipRisk.value,
      authorshipConfidence: computed.authorshipConfidence.value,
      authorshipIntegrity: computed.authorshipIntegrity.value,
      authorshipClassification: computed.authorshipClassification,
      scoringPolicyVersion: 'v1',
    });
    expect(toAuthorScoreView(null)).toBeNull();
  });
});
