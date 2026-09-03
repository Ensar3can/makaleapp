export type {
  AIAuthorshipDetector,
  AIProvider,
  AIUsage,
  AuthorshipDetectionResult,
  PipelineArticleInput,
  PipelineContentEvidence,
  PipelineContentMetric,
  PipelineResult,
  PipelineSourceReference,
  PromptDefinition,
  PromptRegistry,
  RawStructuredAnalysis,
  ResearchHit,
  ResearchLookup,
  ResearchLookupResult,
  StructuredAnalysisRequest,
  StructuredParseable,
  UsageRecord,
  UsageTotals,
  UsageTracker,
} from './types';

export { AIProviderError, PromptNotFoundError, StructuredOutputError } from './errors';
export { StructuredOutputValidator } from './structured-output-validator';
export { InMemoryPromptRegistry, createFoundationPromptRegistry } from './prompt-registry';
export { InMemoryUsageTracker } from './usage-tracker';
export { FakeAIProvider } from './fake-ai-provider';
export type { FakeAIProviderOptions } from './fake-ai-provider';
export { OpenAICompatibleProvider } from './openai-compatible-provider';
export type { OpenAICompatibleProviderOptions } from './openai-compatible-provider';
export { FakeAIAuthorshipDetector, FAKE_AUTHORSHIP_DETECTOR_VERSION } from './fake-ai-authorship-detector';
export {
  StylometricAuthorshipDetector,
  STYLOMETRIC_AUTHORSHIP_DETECTOR_VERSION,
} from './stylometric-authorship-detector';
export {
  interpretModelAuthorshipSignals,
  inferFakeAuthorshipSignals,
  MODEL_AUTHORSHIP_DETECTOR_VERSION,
} from './model-authorship-detector';
export { toAuthorshipObservation } from './to-authorship-observation';
export {
  ArticleAnalysisPipeline,
  ANALYSIS_PIPELINE_VERSION,
} from './article-analysis-pipeline';
export type { ArticleAnalysisPipelineDeps } from './article-analysis-pipeline';
export {
  createContentAnalysisPipeline,
  createFakeAnalysisPipeline,
  toAnalyzerOutcome,
} from './create-content-analysis-pipeline';
export type {
  AnalyzerOutcome,
  ContentAnalysisPipelineOptions,
  FakeAnalysisPipelineOptions,
} from './create-content-analysis-pipeline';
export {
  AUTHORSHIP_ANALYSIS_PROMPT,
  ARTICLE_STRUCTURE_PROMPT,
  ARTICLE_TYPE_PROMPT,
  CLAIM_EXTRACTION_PROMPT,
  CONTENT_PROMPT_BUNDLE_VERSION,
  FACT_EVALUATION_PROMPT,
  FOUNDATION_PROMPTS,
  FOUNDATION_PROMPT_BUNDLE_VERSION,
  QUALITY_ANALYSIS_PROMPT,
  RESEARCH_PROMPT_BUNDLE_VERSION,
  AUTHORSHIP_PROMPT_BUNDLE_VERSION,
  TOPIC_ANALYSIS_PROMPT,
  UNTRUSTED_DATA_PREAMBLE,
} from './prompts';
export { UNTRUSTED_DATA_FENCE_BEGIN, UNTRUSTED_DATA_FENCE_END, fenceUntrustedPayload } from '@aip/domain';
export {
  PIPELINE_STAGE_SCHEMAS,
  articleStructureOutputSchema,
  articleTypeOutputSchema,
  authorshipAnalysisOutputSchema,
  claimExtractionOutputSchema,
  factEvaluationOutputSchema,
  qualityAnalysisOutputSchema,
  stageSchema,
  topicAnalysisOutputSchema,
} from './schemas';
export type { PipelineStageId } from './schemas';
