import {
  assessAuthorship,
  preprocessArticle,
  scoreContentAnalysis,
  scoreOriginality,
  scoreResearchAnalysis,
  selectClaimsForVerification,
  type ClaimEvaluationObservation,
  type ExtractedClaim,
  type QualityObservations,
  type StructureObservations,
  type TopicObservations,
  type TypeClassification,
} from '@aip/domain';
import { collectClaimSources, verifyExtractedCitations } from './collect-research';
import { AIProviderError, PromptNotFoundError, StructuredOutputError } from './errors';
import { interpretModelAuthorshipSignals } from './model-authorship-detector';
import { CONTENT_PROMPT_BUNDLE_VERSION } from './prompts';
import {
  PIPELINE_STAGE_SCHEMAS,
  articleStructureOutputSchema,
  articleTypeOutputSchema,
  authorshipAnalysisOutputSchema,
  claimExtractionOutputSchema,
  factEvaluationOutputSchema,
  qualityAnalysisOutputSchema,
  topicAnalysisOutputSchema,
  type PipelineStageId,
} from './schemas';
import { StructuredOutputValidator } from './structured-output-validator';
import { toAuthorshipObservation } from './to-authorship-observation';
import type {
  AIAuthorshipDetector,
  AIProvider,
  PipelineArticleInput,
  PipelineResult,
  PromptRegistry,
  ResearchLookup,
  UsageTracker,
} from './types';

export const ANALYSIS_PIPELINE_VERSION = 'analysis-pipeline-score-1';

const OBSERVATION_STAGES: readonly PipelineStageId[] = [
  'article-type-v1',
  'article-structure-v1',
  'topic-analysis-v1',
  'quality-analysis-v1',
  'claim-extraction-v1',
];

const FINAL_STAGES: readonly PipelineStageId[] = ['fact-evaluation-v1', 'authorship-analysis-v1'];

export interface ArticleAnalysisPipelineDeps {
  readonly provider: AIProvider;
  readonly research: ResearchLookup;
  readonly authorship: AIAuthorshipDetector;
  readonly prompts: PromptRegistry;
  readonly usage: UsageTracker;
  readonly validator?: StructuredOutputValidator;
}

export class ArticleAnalysisPipeline {
  private readonly validator: StructuredOutputValidator;

  public constructor(private readonly deps: ArticleAnalysisPipelineDeps) {
    this.validator = deps.validator ?? new StructuredOutputValidator();
  }

  public async run(input: PipelineArticleInput): Promise<PipelineResult> {
    try {
      const preprocessed = preprocessArticle({
        title: input.title,
        abstract: input.abstract,
        content: input.content,
        contentHash: input.contentHash,
        language: input.language,
      });
      const outputs = new Map<PipelineStageId, unknown>();
      let modelProvider = 'unknown';
      let modelName = 'unknown';
      const baseInput = {
        title: input.title,
        abstract: input.abstract,
        content: input.content,
        contentHash: input.contentHash,
        language: input.language,
        categories: input.categories,
        tags: input.tags,
        preprocessing: {
          wordCount: preprocessed.wordCount,
          headingCount: preprocessed.structural.headingCount,
          paragraphCount: preprocessed.paragraphCount,
          citationCount: preprocessed.citations.length,
          referenceCount: preprocessed.references.length,
        },
      };

      for (const promptId of OBSERVATION_STAGES) {
        const raw = await this.runStage(promptId, baseInput);
        outputs.set(promptId, raw.value);
        modelProvider = raw.modelProvider;
        modelName = raw.modelName;
      }

      const claims = claimExtractionOutputSchema.parse(outputs.get('claim-extraction-v1'))
        .claims as ExtractedClaim[];
      const selectedClaims = selectClaimsForVerification(claims);
      const collectedSources = await collectClaimSources(selectedClaims, this.deps.research);
      const citationChecks = await verifyExtractedCitations(
        preprocessed.urls,
        preprocessed.citations,
        this.deps.research,
      );

      for (const promptId of FINAL_STAGES) {
        const stageInput =
          promptId === 'fact-evaluation-v1'
            ? {
                ...baseInput,
                claims: selectedClaims,
                collectedSources,
                citationChecks: citationChecks.map((check) => ({
                  citation: check.citation,
                  status: check.status,
                  blocked: check.blocked,
                })),
              }
            : baseInput;
        const raw = await this.runStage(promptId, stageInput);
        outputs.set(promptId, raw.value);
        modelProvider = raw.modelProvider;
        modelName = raw.modelName;
      }

      const type = articleTypeOutputSchema.parse(outputs.get('article-type-v1')) as TypeClassification;
      const structure = articleStructureOutputSchema.parse(
        outputs.get('article-structure-v1'),
      ) as StructureObservations;
      const topic = topicAnalysisOutputSchema.parse(outputs.get('topic-analysis-v1')) as TopicObservations;
      const quality = qualityAnalysisOutputSchema.parse(
        outputs.get('quality-analysis-v1'),
      ) as QualityObservations;
      const factEvaluation = factEvaluationOutputSchema.parse(outputs.get('fact-evaluation-v1'));
      const scored = scoreContentAnalysis({
        type,
        structure,
        topic,
        quality,
        preprocessed,
        categories: input.categories,
        tags: input.tags,
      });
      const research = scoreResearchAnalysis({
        articleType: scored.articleType,
        preprocessed,
        claims,
        collectedSources,
        citationChecks,
        claimEvaluations: factEvaluation.evaluations as ClaimEvaluationObservation[],
      });
      const originality = scoreOriginality({ content: input.content });

      const modelAuthorship = authorshipAnalysisOutputSchema.parse(outputs.get('authorship-analysis-v1'));
      const injected = await this.deps.authorship.detect(input.content);
      const authorship = assessAuthorship({
        detectors: [
          toAuthorshipObservation(this.deps.authorship.name, injected),
          toAuthorshipObservation(
            'model-signals',
            interpretModelAuthorshipSignals(modelAuthorship, modelName),
          ),
        ],
      });
      const totals = this.deps.usage.totals();

      return {
        ok: true,
        pipelineVersion: ANALYSIS_PIPELINE_VERSION,
        promptVersion: CONTENT_PROMPT_BUNDLE_VERSION,
        modelProvider,
        modelName,
        tokenUsage: totals.tokenUsage,
        estimatedCost: totals.estimatedCost,
        stageCount: OBSERVATION_STAGES.length + FINAL_STAGES.length,
        researchHits: collectedSources.length,
        usageRecords: this.deps.usage.list().map(({ recordedAt: _recordedAt, ...record }) => record),
        authorship: {
          riskScore: authorship.assessment.riskScore.value,
          confidenceScore: authorship.assessment.confidenceScore.value,
          classification: authorship.classification,
          signals: authorship.assessment.signals.map((signal) => signal.name),
          explanation: authorship.assessment.explanation,
          modelVersion: authorship.assessment.modelVersion,
          detectorVersion: authorship.assessment.detectorVersion,
        },
        articleType: scored.articleType,
        detectedTopics: scored.detectedTopics,
        metrics: [...scored.metrics, ...research.metrics, ...originality.metrics, ...authorship.metrics],
        evidence: [
          ...scored.evidence,
          ...research.evidence.map((item) => ({
            metricType: item.metricType,
            evidenceType: item.evidenceType,
            claim: item.claim,
            evidence: item.evidence,
            sourceUrl: item.sourceUrl,
            sourceTitle: item.sourceTitle,
            reliability: item.reliability,
          })),
          ...originality.evidence.map((item) => ({
            metricType: item.metricType,
            evidenceType: item.evidenceType,
            claim: item.claim,
            evidence: item.evidence,
            sourceUrl: item.sourceUrl,
            sourceTitle: item.sourceTitle,
            reliability: item.reliability,
          })),
          ...authorship.evidence.map((item) => ({
            metricType: item.metricType,
            evidenceType: item.evidenceType,
            claim: item.claim,
            evidence: item.evidence,
            sourceUrl: item.sourceUrl,
            sourceTitle: item.sourceTitle,
            reliability: item.reliability,
          })),
        ],
        sources: research.sources,
      };
    } catch (error) {
      return toFailure(error);
    }
  }

  private async runStage(
    promptId: PipelineStageId,
    input: unknown,
  ): Promise<{ value: unknown; modelProvider: string; modelName: string }> {
    const prompt = this.deps.prompts.get(promptId);
    const raw = await this.deps.provider.analyzeStructured({
      promptId: prompt.id,
      promptVersion: prompt.version,
      system: prompt.system,
      userTemplate: prompt.userTemplate,
      input,
    });
    const value = this.validator.validate<unknown>(raw.value, PIPELINE_STAGE_SCHEMAS[promptId]);
    this.deps.usage.record({
      provider: raw.modelProvider,
      model: raw.modelName,
      promptId: prompt.id,
      promptVersion: prompt.version,
      inputTokens: raw.usage.inputTokens,
      outputTokens: raw.usage.outputTokens,
      estimatedCost: raw.usage.estimatedCost,
      latencyMs: raw.usage.latencyMs,
    });

    return { value, modelProvider: raw.modelProvider, modelName: raw.modelName };
  }
}

function toFailure(error: unknown): PipelineResult {
  if (error instanceof StructuredOutputError || error instanceof PromptNotFoundError) {
    return { ok: false, reason: error.message, retryable: false };
  }

  if (error instanceof AIProviderError) {
    return { ok: false, reason: error.message, retryable: error.retryable };
  }

  const reason = error instanceof Error ? error.message : 'Unknown pipeline failure';
  return { ok: false, reason, retryable: true };
}
