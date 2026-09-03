import { describe, expect, it } from 'vitest';
import { assessAuthorship, AIAuthorshipAssessmentService } from './authorship-analysis-scoring';
import {
  AUTHORSHIP_ENSEMBLE_VERSION,
  AUTHORSHIP_RISK_DISCLAIMER,
  type AuthorshipDetectorObservation,
} from './authorship-analysis';
import { AnalysisEvidenceType, AuthorshipClassification, MetricType } from './enums';
import { Score } from './score';
import { ScoringPolicy } from './scoring-policy';

const NOW = new Date('2026-08-30T16:00:00.000Z');

function detector(
  name: string,
  riskScore: number,
  confidenceScore: number,
  signal = name,
): AuthorshipDetectorObservation {
  return {
    name,
    riskScore,
    confidenceScore,
    signals: [{ name: signal, description: `${signal} observed by ${name}` }],
    explanation: `${name} produced a risk estimate, not a verdict.`,
    modelVersion: `${name}-model`,
    detectorVersion: `${name}-1`,
  };
}

describe('AIAuthorshipAssessmentService', () => {
  it('aggregates named ensemble detectors with policy classification', () => {
    const result = assessAuthorship({
      detectors: [detector('stylometric', 70, 60, 'low-burstiness'), detector('model-signals', 50, 40, 'limited-signal')],
      createdAt: NOW,
    });

    expect(result.metrics).toHaveLength(1);
    expect(result.metrics[0]?.metricType).toBe(MetricType.AI_AUTHORSHIP_RISK);
    expect(result.assessment.riskScore.value).toBeCloseTo(61);
    expect(result.assessment.confidenceScore.value).toBeLessThan(60);
    expect(result.classification).toBe(AuthorshipClassification.ELEVATED);
    expect(result.assessment.detectorVersion).toBe(AUTHORSHIP_ENSEMBLE_VERSION);
    expect(result.assessment.explanation).toMatch(/not a verdict/i);
    expect(result.assessment.explanation).not.toMatch(/\b(AI-written|human-written|true|false)\b/i);
  });

  it('lowers confidence when detectors disagree and when only one detector runs', () => {
    const agreed = assessAuthorship({
      detectors: [detector('stylometric', 48, 70), detector('model-signals', 50, 70)],
      createdAt: NOW,
    });
    const disagreed = assessAuthorship({
      detectors: [detector('stylometric', 20, 70), detector('model-signals', 80, 70)],
      createdAt: NOW,
    });
    const single = assessAuthorship({
      detectors: [detector('stylometric', 48, 70)],
      createdAt: NOW,
    });

    expect(disagreed.assessment.confidenceScore.value).toBeLessThan(agreed.assessment.confidenceScore.value);
    expect(single.assessment.confidenceScore.value).toBeLessThan(70);
    expect(single.assessment.confidenceScore.value).toBeCloseTo(52.5);
  });

  it('persists individual detector outputs, signals, classification, and the UI disclaimer', () => {
    const result = new AIAuthorshipAssessmentService().assess({
      detectors: [detector('stylometric', 88, 70, 'generic-transitions')],
      createdAt: NOW,
    });

    expect(result.classification).toBe(AuthorshipClassification.HIGH);
    expect(result.evidence.some((item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER)).toBe(
      true,
    );
    expect(
      result.evidence.find((item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER)?.evidence,
    ).toBe(AUTHORSHIP_RISK_DISCLAIMER);
    expect(result.evidence.some((item) => item.claim === 'stylometric')).toBe(true);
    expect(result.evidence.some((item) => item.claim === 'generic-transitions')).toBe(true);
    expect(
      result.evidence.find((item) => item.evidenceType === AnalysisEvidenceType.AUTHORSHIP_CLASSIFICATION)?.claim,
    ).toBe(AuthorshipClassification.HIGH);
    expect(result).not.toHaveProperty('overallScore');
  });

  it('stays neutral and low-confidence when no detector produced output', () => {
    const result = assessAuthorship({ detectors: [], createdAt: NOW });

    expect(result.assessment.riskScore.value).toBe(50);
    expect(result.assessment.confidenceScore.value).toBe(10);
    expect(result.classification).toBe(AuthorshipClassification.UNCERTAIN);
    expect(result.assessment.explanation).toMatch(/not a verdict/i);
  });

  it('classifies through the supplied scoring policy rather than a hardcoded band', () => {
    const strict = ScoringPolicy.create({
      ...ScoringPolicy.initial(),
      version: 'authorship-test',
      authorshipClassificationThresholds: {
        veryLowMax: Score.from(10),
        lowMax: Score.from(20),
        uncertainMax: Score.from(30),
        elevatedMax: Score.from(40),
      },
    });
    const result = assessAuthorship(
      { detectors: [detector('stylometric', 35, 80)], createdAt: NOW },
      strict,
    );

    expect(result.classification).toBe(AuthorshipClassification.ELEVATED);
    expect(result.assessment.classification).toBe(AuthorshipClassification.ELEVATED);
  });
});
