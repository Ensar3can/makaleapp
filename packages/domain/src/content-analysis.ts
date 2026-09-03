import type {
  ArticleType,
  BurdenSignal,
  ContradictionSignal,
  PersistableAnalysisMetricType,
  QualitativeSignal,
} from './enums';

export interface StructureObservations {
  readonly hasIntroduction: boolean;
  readonly hasConclusion: boolean;
  readonly hasMethods: boolean;
  readonly hasReferences: boolean;
  readonly sectionCount: number;
  readonly paragraphCoherence: QualitativeSignal;
  readonly argumentProgression: QualitativeSignal;
  readonly abstractRelevance: QualitativeSignal;
  readonly notes: string;
}

export interface TopicObservations {
  readonly detectedTopics: readonly string[];
  readonly titleAbstractAlignment: QualitativeSignal;
  readonly bodyAlignment: QualitativeSignal;
  readonly categoryAlignment: QualitativeSignal;
  readonly possibleCategoryMismatch: boolean;
  readonly notes: string;
}

export interface QualityObservations {
  readonly clarity: QualitativeSignal;
  readonly depth: QualitativeSignal;
  readonly argumentCoherence: QualitativeSignal;
  readonly informationalValue: QualitativeSignal;
  readonly repetition: BurdenSignal;
  readonly unsupportedAssertions: BurdenSignal;
  readonly internalContradictions: ContradictionSignal;
  readonly notes: string;
}

export interface TypeClassification {
  readonly articleType: ArticleType;
  readonly confidence: number;
  readonly rationale: string;
}

export interface ContentMetricDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly score: number;
  readonly confidence: number;
  readonly explanation: string;
}

export interface ContentEvidenceDraft {
  readonly metricType: PersistableAnalysisMetricType;
  readonly evidenceType: string;
  readonly claim: string;
  readonly evidence: string;
  readonly sourceUrl?: string | null;
  readonly sourceTitle?: string | null;
  readonly reliability?: number | null;
}

export interface ContentAnalysisResult {
  readonly articleType: ArticleType;
  readonly detectedTopics: readonly string[];
  readonly metrics: readonly ContentMetricDraft[];
  readonly evidence: readonly ContentEvidenceDraft[];
}
