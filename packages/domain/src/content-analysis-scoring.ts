import { ArticleEvaluationPolicy } from './article-evaluation-policy';
import type { PreprocessedArticle } from './article-preprocessor';
import type {
  ContentAnalysisResult,
  ContentEvidenceDraft,
  ContentMetricDraft,
  QualityObservations,
  StructureObservations,
  TopicObservations,
  TypeClassification,
} from './content-analysis';
import {
  AnalysisEvidenceType,
  BurdenSignal,
  ContradictionSignal,
  MetricType,
  QualitativeSignal,
} from './enums';
import { Score } from './score';

const QUALITATIVE_POINTS: Record<QualitativeSignal, number> = {
  [QualitativeSignal.WEAK]: 35,
  [QualitativeSignal.ADEQUATE]: 70,
  [QualitativeSignal.STRONG]: 90,
};

const BURDEN_POINTS: Record<BurdenSignal, number> = {
  [BurdenSignal.LOW]: 90,
  [BurdenSignal.MODERATE]: 60,
  [BurdenSignal.HIGH]: 30,
};

const CONTRADICTION_POINTS: Record<ContradictionSignal, number> = {
  [ContradictionSignal.NONE]: 95,
  [ContradictionSignal.MINOR]: 65,
  [ContradictionSignal.MAJOR]: 25,
};

const PRESENT = 100;
const MISSING_REQUIRED = 25;

export interface ScoreContentAnalysisInput {
  readonly type: TypeClassification;
  readonly structure: StructureObservations;
  readonly topic: TopicObservations;
  readonly quality: QualityObservations;
  readonly preprocessed: PreprocessedArticle;
  readonly categories: readonly string[];
  readonly tags: readonly string[];
}

export function scoreContentAnalysis(input: ScoreContentAnalysisInput): ContentAnalysisResult {
  const policy = ArticleEvaluationPolicy.forType(input.type.articleType);
  const structure = scoreStructure(input.structure, policy, input.preprocessed);
  const topic = scoreTopic(input.topic, input.categories);
  const quality = scoreQuality(input.quality);
  const typeConfidence = Score.from(clamp(input.type.confidence * 100, 0, 100));

  const metrics: ContentMetricDraft[] = [
    {
      metricType: MetricType.STRUCTURE,
      score: structure.score.value,
      confidence: blendConfidence(typeConfidence.value, structure.confidence),
      explanation: structure.explanation,
    },
    {
      metricType: MetricType.CONTENT_QUALITY,
      score: quality.score.value,
      confidence: blendConfidence(typeConfidence.value, quality.confidence),
      explanation: quality.explanation,
    },
    {
      metricType: MetricType.TOPIC_RELEVANCE,
      score: topic.score.value,
      confidence: blendConfidence(typeConfidence.value, topic.confidence),
      explanation: topic.explanation,
    },
  ];

  return {
    articleType: input.type.articleType,
    detectedTopics: input.topic.detectedTopics,
    metrics,
    evidence: [
      ...typeEvidence(input.type),
      ...preprocessEvidence(input.preprocessed),
      ...structure.evidence,
      ...topic.evidence,
      ...quality.evidence,
    ],
  };
}

function scoreStructure(
  observations: StructureObservations,
  policy: ArticleEvaluationPolicy,
  preprocessed: PreprocessedArticle,
): ScoredMetric {
  const components: number[] = [];
  const missing: string[] = [];

  addRequirement(
    components,
    missing,
    policy.structure.requiresIntroduction,
    observations.hasIntroduction,
    'introduction',
  );
  addRequirement(
    components,
    missing,
    policy.structure.requiresConclusion,
    observations.hasConclusion,
    'conclusion',
  );
  addRequirement(
    components,
    missing,
    policy.structure.requiresMethods,
    observations.hasMethods,
    'methods',
  );
  addRequirement(
    components,
    missing,
    policy.structure.requiresReferences,
    observations.hasReferences || preprocessed.references.length > 0,
    'references',
  );

  const sectionRatio = Math.min(1, observations.sectionCount / policy.structure.minimumSections);
  components.push(sectionRatio * 100);
  components.push(QUALITATIVE_POINTS[observations.paragraphCoherence]);
  components.push(QUALITATIVE_POINTS[observations.argumentProgression]);
  components.push(QUALITATIVE_POINTS[observations.abstractRelevance]);

  if (policy.structure.minimumSections >= 3 && preprocessed.structural.headingCount === 0) {
    components.push(40);
  }

  const score = averageScore(components);
  const confidence = missing.length === 0 ? 80 : 55;
  const explanation = missing.length
    ? `Structure scored against the ${policy.articleType} policy. Missing required sections: ${missing.join(', ')}.`
    : `Structure meets the required ${policy.articleType} sections. ${observations.notes}`;

  const evidence: ContentEvidenceDraft[] = [
    {
      metricType: MetricType.STRUCTURE,
      evidenceType: AnalysisEvidenceType.STRUCTURAL_OBSERVATION,
      claim: `Article type ${policy.articleType} expects ${policy.structure.minimumSections} sections`,
      evidence: `Observed ${observations.sectionCount} sections, ${preprocessed.structural.headingCount} headings, ${preprocessed.paragraphCount} paragraphs.`,
    },
    ...missing.map((section): ContentEvidenceDraft => ({
      metricType: MetricType.STRUCTURE,
      evidenceType: AnalysisEvidenceType.MISSING_REQUIRED_SECTION,
      claim: `${section} is required for ${policy.articleType} articles`,
      evidence: `The ${section} section was not observed.`,
    })),
  ];

  return { score, confidence, explanation, evidence };
}

function scoreTopic(observations: TopicObservations, categories: readonly string[]): ScoredMetric {
  const alignments = [
    QUALITATIVE_POINTS[observations.titleAbstractAlignment],
    QUALITATIVE_POINTS[observations.bodyAlignment],
  ];

  if (categories.length > 0) {
    alignments.push(QUALITATIVE_POINTS[observations.categoryAlignment]);
  }

  let raw = average(alignments);

  if (observations.possibleCategoryMismatch && categories.length > 0) {
    raw = Math.max(0, raw - 20);
  }

  const score = Score.from(raw);
  const confidence = observations.possibleCategoryMismatch ? 50 : 75;
  const explanation = observations.possibleCategoryMismatch
    ? `Detected topics may not match the selected categories (${categories.join(', ') || 'none'}). ${observations.notes}`
    : `Title, abstract, and body align with the selected taxonomy. ${observations.notes}`;

  const evidence: ContentEvidenceDraft[] = [
    {
      metricType: MetricType.TOPIC_RELEVANCE,
      evidenceType: AnalysisEvidenceType.DETECTED_TOPICS,
      claim: 'Detected topics from the article version',
      evidence: observations.detectedTopics.join(', ') || 'none',
    },
  ];

  if (observations.possibleCategoryMismatch && categories.length > 0) {
    evidence.push({
      metricType: MetricType.TOPIC_RELEVANCE,
      evidenceType: AnalysisEvidenceType.CATEGORY_MISMATCH,
      claim: `Selected categories: ${categories.join(', ')}`,
      evidence: observations.notes,
    });
  }

  return { score, confidence, explanation, evidence };
}

function scoreQuality(observations: QualityObservations): ScoredMetric {
  const substance = average([
    QUALITATIVE_POINTS[observations.clarity],
    QUALITATIVE_POINTS[observations.depth],
    QUALITATIVE_POINTS[observations.argumentCoherence],
    QUALITATIVE_POINTS[observations.informationalValue],
  ]);
  const risk = average([
    BURDEN_POINTS[observations.repetition],
    BURDEN_POINTS[observations.unsupportedAssertions],
    CONTRADICTION_POINTS[observations.internalContradictions],
  ]);
  const score = Score.from(substance * 0.7 + risk * 0.3);
  const weakest = weakestQualityLabel(observations);
  const explanation = `Content quality emphasizes substance over grammar. Weakest signal: ${weakest}. ${observations.notes}`;

  return {
    score,
    confidence: 70,
    explanation,
    evidence: [
      {
        metricType: MetricType.CONTENT_QUALITY,
        evidenceType: AnalysisEvidenceType.QUALITY_SIGNAL,
        claim: `Weakest quality signal is ${weakest}`,
        evidence: observations.notes,
      },
    ],
  };
}

function typeEvidence(type: TypeClassification): ContentEvidenceDraft[] {
  return [
    {
      metricType: MetricType.STRUCTURE,
      evidenceType: AnalysisEvidenceType.ARTICLE_TYPE,
      claim: type.articleType,
      evidence: type.rationale,
    },
  ];
}

function preprocessEvidence(preprocessed: PreprocessedArticle): ContentEvidenceDraft[] {
  return [
    {
      metricType: MetricType.STRUCTURE,
      evidenceType: AnalysisEvidenceType.PREPROCESS_SUMMARY,
      claim: `${preprocessed.wordCount} words, ${preprocessed.structural.headingCount} headings`,
      evidence: `language=${preprocessed.language}; paragraphs=${preprocessed.paragraphCount}; citations=${preprocessed.citations.length}; urls=${preprocessed.urls.length}; references=${preprocessed.references.length}`,
    },
  ];
}

function addRequirement(
  components: number[],
  missing: string[],
  required: boolean,
  present: boolean,
  label: string,
): void {
  if (!required) {
    return;
  }

  components.push(present ? PRESENT : MISSING_REQUIRED);

  if (!present) {
    missing.push(label);
  }
}

function averageScore(values: readonly number[]): Score {
  return Score.from(average(values));
}

function average(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function blendConfidence(typeConfidence: number, metricConfidence: number): number {
  return Score.from((typeConfidence + metricConfidence) / 2).value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function weakestQualityLabel(observations: QualityObservations): string {
  const ranked: Array<{ label: string; points: number }> = [
    { label: 'clarity', points: QUALITATIVE_POINTS[observations.clarity] },
    { label: 'depth', points: QUALITATIVE_POINTS[observations.depth] },
    { label: 'argument coherence', points: QUALITATIVE_POINTS[observations.argumentCoherence] },
    { label: 'informational value', points: QUALITATIVE_POINTS[observations.informationalValue] },
    { label: 'repetition', points: BURDEN_POINTS[observations.repetition] },
    { label: 'unsupported assertions', points: BURDEN_POINTS[observations.unsupportedAssertions] },
    { label: 'internal contradictions', points: CONTRADICTION_POINTS[observations.internalContradictions] },
  ];

  return ranked.reduce((weakest, current) => (current.points < weakest.points ? current : weakest))
    .label;
}

interface ScoredMetric {
  readonly score: Score;
  readonly confidence: number;
  readonly explanation: string;
  readonly evidence: readonly ContentEvidenceDraft[];
}
