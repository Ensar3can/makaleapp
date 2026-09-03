import { AIAuthorshipAssessment, type AIAuthorshipSignal } from './ai-authorship-assessment';
import {
  AUTHORSHIP_DETECTOR_WEIGHTS,
  AUTHORSHIP_ENSEMBLE_VERSION,
  AUTHORSHIP_RISK_DISCLAIMER,
  type AssessAuthorshipInput,
  type AuthorshipAnalysisResult,
  type AuthorshipDetectorObservation,
  type AuthorshipEvidenceDraft,
} from './authorship-analysis';
import { AnalysisEvidenceType, MetricType } from './enums';
import { Score } from './score';
import { ScoringPolicy } from './scoring-policy';

export class AIAuthorshipAssessmentService {
  public constructor(private readonly policy: ScoringPolicy = ScoringPolicy.initial()) {}

  public assess(input: AssessAuthorshipInput): AuthorshipAnalysisResult {
    const createdAt = input.createdAt ?? new Date(0);
    const detectors = input.detectors.filter((detector) => isFiniteScore(detector.riskScore));

    if (detectors.length === 0) {
      return this.toResult(
        {
          name: 'none',
          riskScore: 50,
          confidenceScore: 10,
          signals: [
            {
              name: 'no-detector-output',
              description: 'No detector produced a usable observation.',
            },
          ],
          explanation:
            'No authorship detector produced a usable observation. Risk stays neutral and confidence stays low. This is not a verdict that a human or a model wrote the article.',
          modelVersion: 'none',
          detectorVersion: AUTHORSHIP_ENSEMBLE_VERSION,
        },
        [],
        createdAt,
      );
    }

    const weights = detectorWeights(detectors.map((detector) => detector.name));
    const riskScore = weightedAverage(
      detectors.map((detector) => clampScore(detector.riskScore)),
      weights,
    );
    const rawConfidence = weightedAverage(
      detectors.map((detector) => clampScore(detector.confidenceScore)),
      weights,
    );
    const confidenceScore = clampScore(rawConfidence * agreementScale(detectors));
    const signals = uniqueSignals(detectors);
    const explanation = buildExplanation(detectors, riskScore, confidenceScore);

    return this.toResult(
      {
        name: AUTHORSHIP_ENSEMBLE_VERSION,
        riskScore,
        confidenceScore,
        signals,
        explanation,
        modelVersion: detectors.map((detector) => detector.modelVersion).join('+'),
        detectorVersion: AUTHORSHIP_ENSEMBLE_VERSION,
      },
      detectors,
      createdAt,
    );
  }

  private toResult(
    combined: AuthorshipDetectorObservation,
    detectors: readonly AuthorshipDetectorObservation[],
    createdAt: Date,
  ): AuthorshipAnalysisResult {
    const assessment = AIAuthorshipAssessment.create(
      {
        riskScore: Score.from(clampScore(combined.riskScore)),
        confidenceScore: Score.from(clampScore(combined.confidenceScore)),
        signals: combined.signals,
        explanation: combined.explanation,
        modelVersion: combined.modelVersion,
        detectorVersion: combined.detectorVersion,
        createdAt,
      },
      this.policy,
    );

    return {
      assessment,
      classification: assessment.classification,
      metrics: [
        {
          metricType: MetricType.AI_AUTHORSHIP_RISK,
          score: assessment.riskScore.value,
          confidence: assessment.confidenceScore.value,
          explanation: assessment.explanation,
        },
      ],
      evidence: [
        disclaimerEvidence(),
        classificationEvidence(assessment.classification),
        ...detectors.flatMap(detectorEvidence),
        ...combined.signals.map(signalEvidence),
      ],
    };
  }
}

export function assessAuthorship(
  input: AssessAuthorshipInput,
  policy: ScoringPolicy = ScoringPolicy.initial(),
): AuthorshipAnalysisResult {
  return new AIAuthorshipAssessmentService(policy).assess(input);
}

function detectorWeights(names: readonly string[]): number[] {
  const known = names.every((name) => name in AUTHORSHIP_DETECTOR_WEIGHTS);

  if (known) {
    const raw = names.map(
      (name) => AUTHORSHIP_DETECTOR_WEIGHTS[name as keyof typeof AUTHORSHIP_DETECTOR_WEIGHTS],
    );
    const sum = raw.reduce((total, weight) => total + weight, 0);
    return raw.map((weight) => weight / sum);
  }

  return names.map(() => 1 / names.length);
}

function agreementScale(detectors: readonly AuthorshipDetectorObservation[]): number {
  if (detectors.length < 2) {
    return 0.75;
  }

  const risks = detectors.map((detector) => clampScore(detector.riskScore));
  const mean = average(risks);
  const stdev = Math.sqrt(average(risks.map((risk) => (risk - mean) ** 2)));
  return clamp(1 - stdev / 50, 0.35, 1);
}

function buildExplanation(
  detectors: readonly AuthorshipDetectorObservation[],
  riskScore: number,
  confidenceScore: number,
): string {
  const names = detectors.map((detector) => detector.name).join(', ');
  return (
    `Ensemble of ${detectors.length} detector(s) [${names}] produced AI authorship risk ` +
    `${Math.round(riskScore)} with confidence ${Math.round(confidenceScore)}. ` +
    `This is a risk and confidence estimate, not a verdict that a human or a model wrote the article.`
  );
}

function uniqueSignals(
  detectors: readonly AuthorshipDetectorObservation[],
): AIAuthorshipSignal[] {
  const byName = new Map<string, AIAuthorshipSignal>();

  for (const detector of detectors) {
    for (const signal of detector.signals) {
      if (!byName.has(signal.name)) {
        byName.set(signal.name, signal);
      }
    }
  }

  return [...byName.values()];
}

function detectorEvidence(detector: AuthorshipDetectorObservation): AuthorshipEvidenceDraft[] {
  return [
    {
      metricType: MetricType.AI_AUTHORSHIP_RISK,
      evidenceType: AnalysisEvidenceType.AUTHORSHIP_DETECTOR_OUTPUT,
      claim: detector.name,
      evidence:
        `risk=${clampScore(detector.riskScore)};confidence=${clampScore(detector.confidenceScore)};` +
        `version=${detector.detectorVersion};model=${detector.modelVersion}. ${detector.explanation}`,
      sourceUrl: null,
      sourceTitle: detector.detectorVersion,
      reliability: clampScore(detector.riskScore),
    },
  ];
}

function signalEvidence(signal: AIAuthorshipSignal): AuthorshipEvidenceDraft {
  return {
    metricType: MetricType.AI_AUTHORSHIP_RISK,
    evidenceType: AnalysisEvidenceType.AUTHORSHIP_SIGNAL,
    claim: signal.name,
    evidence: signal.description,
    sourceUrl: null,
    sourceTitle: null,
    reliability: null,
  };
}

function classificationEvidence(classification: string): AuthorshipEvidenceDraft {
  return {
    metricType: MetricType.AI_AUTHORSHIP_RISK,
    evidenceType: AnalysisEvidenceType.AUTHORSHIP_CLASSIFICATION,
    claim: classification,
    evidence:
      `Risk band ${classification} comes from ScoringPolicy thresholds. ` +
      `It is a risk band, not a human-or-model verdict.`,
    sourceUrl: null,
    sourceTitle: null,
    reliability: null,
  };
}

function disclaimerEvidence(): AuthorshipEvidenceDraft {
  return {
    metricType: MetricType.AI_AUTHORSHIP_RISK,
    evidenceType: AnalysisEvidenceType.AUTHORSHIP_DISCLAIMER,
    claim: 'AI authorship risk',
    evidence: AUTHORSHIP_RISK_DISCLAIMER,
    sourceUrl: null,
    sourceTitle: null,
    reliability: null,
  };
}

function weightedAverage(values: readonly number[], weights: readonly number[]): number {
  return values.reduce((total, value, index) => total + value * (weights[index] ?? 0), 0);
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function clampScore(value: number): number {
  return Math.round(clamp(value, 0, 100) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isFiniteScore(value: number): boolean {
  return Number.isFinite(value);
}
