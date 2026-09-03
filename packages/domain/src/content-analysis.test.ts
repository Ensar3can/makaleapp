import { describe, expect, it } from 'vitest';
import { AnalysisEvidence } from './analysis-evidence';
import { AnalysisMetric } from './analysis-metric';
import { ArticleEvaluationPolicy } from './article-evaluation-policy';
import { preprocessArticle } from './article-preprocessor';
import { scoreContentAnalysis } from './content-analysis-scoring';
import {
  AnalysisEvidenceType,
  ArticleType,
  BurdenSignal,
  ContradictionSignal,
  MetricType,
  QualitativeSignal,
} from './enums';
import { InvalidAnalysisEvidenceError, InvalidAnalysisMetricError } from './errors';
import {
  asAnalysisEvidenceId,
  asAnalysisMetricId,
  asAnalysisRunId,
} from './ids';
import { Score } from './score';
import type { QualityObservations, StructureObservations, TopicObservations } from './content-analysis';

const NOW = new Date('2026-08-30T14:00:00.000Z');

const RESEARCH_BODY = [
  '# Introduction',
  'This paper studies evaluation binding.',
  '',
  '# Methods',
  'We measured version hashes (Smith, 2024) and cited prior work [1].',
  'See https://example.org/methods and doi 10.1000/xyz123.',
  '',
  '# Results',
  'The pipeline stayed bound to ArticleVersion.',
  '',
  '# Conclusion',
  'Analysis must not invent an overall score here.',
  '',
  '# References',
  'Smith, A. (2024). Evaluation binding.',
  '',
  'Keywords: evaluation, binding, versions',
].join('\n');

function structure(overrides: Partial<StructureObservations> = {}): StructureObservations {
  return {
    hasIntroduction: true,
    hasConclusion: true,
    hasMethods: true,
    hasReferences: true,
    sectionCount: 4,
    paragraphCoherence: QualitativeSignal.ADEQUATE,
    argumentProgression: QualitativeSignal.ADEQUATE,
    abstractRelevance: QualitativeSignal.STRONG,
    notes: 'Observed a conventional research layout.',
    ...overrides,
  };
}

function topic(overrides: Partial<TopicObservations> = {}): TopicObservations {
  return {
    detectedTopics: ['evaluation', 'article versions'],
    titleAbstractAlignment: QualitativeSignal.STRONG,
    bodyAlignment: QualitativeSignal.ADEQUATE,
    categoryAlignment: QualitativeSignal.ADEQUATE,
    possibleCategoryMismatch: false,
    notes: 'Topics match the selected category.',
    ...overrides,
  };
}

function quality(overrides: Partial<QualityObservations> = {}): QualityObservations {
  return {
    clarity: QualitativeSignal.ADEQUATE,
    depth: QualitativeSignal.ADEQUATE,
    argumentCoherence: QualitativeSignal.STRONG,
    informationalValue: QualitativeSignal.ADEQUATE,
    repetition: BurdenSignal.LOW,
    unsupportedAssertions: BurdenSignal.LOW,
    internalContradictions: ContradictionSignal.NONE,
    notes: 'Substance is adequate; grammar is not the driver.',
    ...overrides,
  };
}

describe('preprocessArticle', () => {
  it('extracts structural signals without calling a model', () => {
    const preprocessed = preprocessArticle({
      title: 'Evaluation Binding Study',
      abstract: 'We bind analysis to versions.',
      content: RESEARCH_BODY,
      contentHash: 'a'.repeat(64),
      language: 'en',
    });

    expect(preprocessed.language).toBe('en');
    expect(preprocessed.wordCount).toBeGreaterThan(20);
    expect(preprocessed.characterCount).toBe(RESEARCH_BODY.length);
    expect(preprocessed.headings).toEqual(
      expect.arrayContaining(['Introduction', 'Methods', 'Results', 'Conclusion', 'References']),
    );
    expect(preprocessed.paragraphCount).toBeGreaterThanOrEqual(4);
    expect(preprocessed.citations).toEqual(expect.arrayContaining(['[1]', '(Smith, 2024)', '10.1000/xyz123']));
    expect(preprocessed.urls).toEqual(['https://example.org/methods']);
    expect(preprocessed.references).toEqual(['Smith, A. (2024). Evaluation binding.']);
    expect(preprocessed.keywords).toEqual(['evaluation', 'binding', 'versions']);
    expect(preprocessed.structural.headingCount).toBeGreaterThanOrEqual(5);
    expect(preprocessed.contentHash).toHaveLength(64);
  });
});

describe('ArticleEvaluationPolicy', () => {
  it('does not require methods for opinion articles', () => {
    const opinion = ArticleEvaluationPolicy.forType(ArticleType.OPINION);
    const research = ArticleEvaluationPolicy.forType(ArticleType.RESEARCH);

    expect(opinion.structure.requiresMethods).toBe(false);
    expect(opinion.structure.requiresReferences).toBe(false);
    expect(research.structure.requiresMethods).toBe(true);
    expect(research.structure.requiresReferences).toBe(true);
    expect(research.structure.minimumSections).toBeGreaterThan(opinion.structure.minimumSections);
  });
});

describe('scoreContentAnalysis', () => {
  const preprocessed = preprocessArticle({
    title: 'Evaluation Binding Study',
    abstract: 'We bind analysis to versions.',
    content: RESEARCH_BODY,
    contentHash: 'b'.repeat(64),
    language: 'en',
  });

  it('scores structure, topic, and quality without an overall score', () => {
    const result = scoreContentAnalysis({
      type: {
        articleType: ArticleType.RESEARCH,
        confidence: 0.8,
        rationale: 'Methods and references are present.',
      },
      structure: structure(),
      topic: topic(),
      quality: quality(),
      preprocessed,
      categories: ['Computer Science'],
      tags: ['evaluation'],
    });

    expect(result.articleType).toBe(ArticleType.RESEARCH);
    expect(result.detectedTopics).toEqual(['evaluation', 'article versions']);
    expect(result.metrics.map((metric) => metric.metricType)).toEqual([
      MetricType.STRUCTURE,
      MetricType.CONTENT_QUALITY,
      MetricType.TOPIC_RELEVANCE,
    ]);
    expect(result.metrics.every((metric) => metric.score >= 0 && metric.score <= 100)).toBe(true);
    expect(result.evidence.some((item) => item.evidenceType === AnalysisEvidenceType.ARTICLE_TYPE)).toBe(
      true,
    );
    expect(result).not.toHaveProperty('overallScore');
    expect(result).not.toHaveProperty('qualityScore');
  });

  it('does not punish an opinion article for a missing methods section', () => {
    const missingMethods = structure({ hasMethods: false, sectionCount: 2 });
    const opinion = scoreContentAnalysis({
      type: { articleType: ArticleType.OPINION, confidence: 0.7, rationale: 'Argument essay.' },
      structure: missingMethods,
      topic: topic(),
      quality: quality(),
      preprocessed,
      categories: ['Computer Science'],
      tags: [],
    });
    const research = scoreContentAnalysis({
      type: { articleType: ArticleType.RESEARCH, confidence: 0.7, rationale: 'Empirical paper.' },
      structure: missingMethods,
      topic: topic(),
      quality: quality(),
      preprocessed,
      categories: ['Computer Science'],
      tags: [],
    });

    const opinionStructure = opinion.metrics.find((metric) => metric.metricType === MetricType.STRUCTURE);
    const researchStructure = research.metrics.find((metric) => metric.metricType === MetricType.STRUCTURE);

    expect(opinionStructure?.score).toBeGreaterThan(researchStructure?.score ?? 0);
    expect(research.evidence.some((item) => item.evidenceType === AnalysisEvidenceType.MISSING_REQUIRED_SECTION)).toBe(
      true,
    );
    expect(opinion.evidence.some((item) => item.claim.includes('methods'))).toBe(false);
  });

  it('lowers topic relevance when categories look mismatched', () => {
    const aligned = scoreContentAnalysis({
      type: { articleType: ArticleType.ESSAY, confidence: 0.6, rationale: 'Essay.' },
      structure: structure({ hasMethods: false, sectionCount: 2 }),
      topic: topic(),
      quality: quality(),
      preprocessed,
      categories: ['Computer Science'],
      tags: [],
    });
    const mismatched = scoreContentAnalysis({
      type: { articleType: ArticleType.ESSAY, confidence: 0.6, rationale: 'Essay.' },
      structure: structure({ hasMethods: false, sectionCount: 2 }),
      topic: topic({ possibleCategoryMismatch: true, notes: 'Body is about cooking.' }),
      quality: quality(),
      preprocessed,
      categories: ['Computer Science'],
      tags: [],
    });

    const alignedTopic = aligned.metrics.find((metric) => metric.metricType === MetricType.TOPIC_RELEVANCE);
    const mismatchedTopic = mismatched.metrics.find((metric) => metric.metricType === MetricType.TOPIC_RELEVANCE);

    expect(alignedTopic?.score).toBeGreaterThan(mismatchedTopic?.score ?? 0);
  });
});

describe('AnalysisMetric and AnalysisEvidence', () => {
  it('records metrics bound to an analysis run', () => {
    const metric = AnalysisMetric.record({
      id: asAnalysisMetricId('metric-1'),
      analysisRunId: asAnalysisRunId('run-1'),
      metricType: MetricType.STRUCTURE,
      score: Score.from(72),
      confidence: Score.from(80),
      explanation: 'Meets the opinion-article structure policy.',
      createdAt: NOW,
    });

    expect(metric.isBoundTo(asAnalysisRunId('run-1'))).toBe(true);
    expect(metric.isContentAnalysisMetric()).toBe(true);
    expect(metric.isAuthorshipAnalysisMetric()).toBe(false);
    expect(() =>
      AnalysisMetric.record({
        id: asAnalysisMetricId('metric-2'),
        analysisRunId: asAnalysisRunId('run-1'),
        metricType: MetricType.STRUCTURE,
        score: Score.from(10),
        confidence: Score.from(10),
        explanation: '   ',
        createdAt: NOW,
      }),
    ).toThrow(InvalidAnalysisMetricError);
  });

  it('rejects empty evidence and out-of-range reliability', () => {
    expect(() =>
      AnalysisEvidence.record({
        id: asAnalysisEvidenceId('ev-1'),
        analysisRunId: asAnalysisRunId('run-1'),
        metricType: MetricType.TOPIC_RELEVANCE,
        evidenceType: AnalysisEvidenceType.CATEGORY_MISMATCH,
        claim: 'Selected categories look unrelated',
        evidence: '',
        sourceUrl: null,
        sourceTitle: null,
        reliability: null,
        createdAt: NOW,
      }),
    ).toThrow(InvalidAnalysisEvidenceError);

    expect(() =>
      AnalysisEvidence.record({
        id: asAnalysisEvidenceId('ev-2'),
        analysisRunId: asAnalysisRunId('run-1'),
        metricType: MetricType.STRUCTURE,
        evidenceType: AnalysisEvidenceType.STRUCTURAL_OBSERVATION,
        claim: 'Observed headings',
        evidence: 'Four headings.',
        sourceUrl: null,
        sourceTitle: null,
        reliability: 140,
        createdAt: NOW,
      }),
    ).toThrow(InvalidAnalysisEvidenceError);
  });
});
