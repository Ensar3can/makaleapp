import { describe, expect, it } from 'vitest';
import { AIAuthorshipAssessment } from './ai-authorship-assessment';
import { AuthorshipClassification } from './enums';
import { InvalidScoringPolicyError } from './errors';
import { Score } from './score';
import { ScoringPolicy, type QualityMetricScores } from './scoring-policy';

function uniformMetrics(value: number): QualityMetricScores {
  const score = Score.from(value);

  return {
    structure: score,
    contentQuality: score,
    topicRelevance: score,
    citationQuality: score,
    evidence: score,
    factualReliability: score,
    originality: score,
  };
}

describe('ScoringPolicy', () => {
  const policy = ScoringPolicy.initial();

  it('uses versioned initial weights that sum to 1', () => {
    const weights = Object.values(policy.qualityWeights);
    const sum = weights.reduce((total, weight) => total + weight, 0);

    expect(policy.version).toBe('v1');
    expect(sum).toBeCloseTo(1);
    expect(policy.qualityWeight + policy.authorshipIntegrityWeight).toBeCloseTo(1);
    expect(policy.qualityWeights.citationQuality + policy.qualityWeights.evidence).toBeCloseTo(0.2);
  });

  it('computes a weighted quality score', () => {
    const quality = policy.computeQualityScore({
      structure: Score.from(100),
      contentQuality: Score.from(100),
      topicRelevance: Score.from(0),
      citationQuality: Score.from(0),
      evidence: Score.from(0),
      factualReliability: Score.from(0),
      originality: Score.from(0),
    });

    expect(quality.value).toBe(40);
  });

  it('keeps authorship from changing the final score when confidence is zero', () => {
    const result = policy.evaluate({
      metrics: uniformMetrics(80),
      authorshipRisk: Score.full(),
      authorshipConfidence: Score.zero(),
    });

    expect(result.qualityScore.value).toBe(80);
    expect(result.authorshipIntegrity.value).toBe(0);
    expect(result.effectiveAuthorshipWeight).toBe(0);
    expect(result.overallScore.value).toBe(80);
    expect(result.scoringPolicyVersion).toBe('v1');
  });

  it('applies the full authorship mix when confidence meets the threshold', () => {
    const result = policy.evaluate({
      metrics: uniformMetrics(80),
      authorshipRisk: Score.full(),
      authorshipConfidence: Score.full(),
    });

    expect(result.effectiveAuthorshipWeight).toBeCloseTo(0.15);
    expect(result.overallScore.value).toBe(68);
  });

  it('scales authorship weight linearly below the confidence threshold', () => {
    const result = policy.evaluate({
      metrics: uniformMetrics(80),
      authorshipRisk: Score.full(),
      authorshipConfidence: Score.from(30),
    });

    expect(result.effectiveAuthorshipWeight).toBeCloseTo(0.075);
    expect(result.overallScore.value).toBe(74);
  });

  it('classifies authorship risk from policy thresholds', () => {
    expect(policy.classifyAuthorship(Score.from(20))).toBe(AuthorshipClassification.VERY_LOW);
    expect(policy.classifyAuthorship(Score.from(21))).toBe(AuthorshipClassification.LOW);
    expect(policy.classifyAuthorship(Score.from(40))).toBe(AuthorshipClassification.LOW);
    expect(policy.classifyAuthorship(Score.from(60))).toBe(AuthorshipClassification.UNCERTAIN);
    expect(policy.classifyAuthorship(Score.from(80))).toBe(AuthorshipClassification.ELEVATED);
    expect(policy.classifyAuthorship(Score.from(81))).toBe(AuthorshipClassification.HIGH);
  });

  it('rejects policies whose weights do not form a valid mix', () => {
    expect(() =>
      ScoringPolicy.create({
        version: 'broken',
        qualityWeights: { ...policy.qualityWeights, structure: 0.9 },
        qualityWeight: 0.85,
        authorshipIntegrityWeight: 0.15,
        authorshipConfidenceThreshold: Score.from(60),
        authorshipClassificationThresholds: policy.authorshipClassificationThresholds,
      }),
    ).toThrow(InvalidScoringPolicyError);
  });

  it('derives assessment classification from the active policy', () => {
    const assessment = AIAuthorshipAssessment.create(
      {
        riskScore: Score.from(88),
        confidenceScore: Score.from(70),
        signals: [{ name: 'uniform-style', description: 'Highly uniform sentence cadence' }],
        explanation: 'Multiple detectors observed templated phrasing.',
        modelVersion: 'detector-ensemble-1',
        detectorVersion: 'v1',
        createdAt: new Date('2026-08-29T00:00:00.000Z'),
      },
      policy,
    );

    expect(assessment.classification).toBe(AuthorshipClassification.HIGH);
    expect(assessment.riskScore.value).toBe(88);
  });
});
