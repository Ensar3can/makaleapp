import type { PersistableAnalysisMetricType } from './enums';

export interface OriginalityMetricDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface OriginalityEvidenceDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl: string | null;
  readonly sourceTitle: string | null;
  readonly reliability: number | null;
}

export interface OriginalityAnalysisResult {
  readonly metrics: readonly OriginalityMetricDraft[];
  readonly evidence: readonly OriginalityEvidenceDraft[];
}
