import type { AuthorshipClassification, PersistableAnalysisMetricType } from './enums';
import type { AIAuthorshipAssessment } from './ai-authorship-assessment';

export const AUTHORSHIP_RISK_DISCLAIMER =
  'This is a probabilistic AI authorship risk estimate with a confidence score. It is not a determination that a human or a model wrote the article. One detector never authorizes a high-impact moderation decision.';

export const AUTHORSHIP_ENSEMBLE_VERSION = 'authorship-ensemble-1';

export const AUTHORSHIP_DETECTOR_WEIGHTS = {
  stylometric: 0.55,
  'model-signals': 0.45,
} as const;

export interface AuthorshipDetectorObservation {
  readonly name: string;
  readonly riskScore: number;
  readonly confidenceScore: number;
  readonly signals: readonly AuthorshipSignalObservation[];
  readonly explanation: string;
  readonly modelVersion: string;
  readonly detectorVersion: string;
}

export interface AuthorshipSignalObservation {
  readonly name: string;
  readonly description: string;
}

export interface AuthorshipMetricDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface AuthorshipEvidenceDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl: string | null;
  readonly sourceTitle: string | null;
  readonly reliability: number | null;
}

export interface AuthorshipAnalysisResult {
  readonly assessment: AIAuthorshipAssessment;
  readonly classification: AuthorshipClassification;
  readonly metrics: readonly AuthorshipMetricDraft[];
  readonly evidence: readonly AuthorshipEvidenceDraft[];
}

export interface AssessAuthorshipInput {
  readonly detectors: readonly AuthorshipDetectorObservation[];
  readonly createdAt?: Date;
}
