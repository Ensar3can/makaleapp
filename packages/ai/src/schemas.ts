import { z } from '@aip/validation';
import type { StructuredParseable } from './types';

export const qualitativeSignalSchema = z.enum(['weak', 'adequate', 'strong']);
export const burdenSignalSchema = z.enum(['low', 'moderate', 'high']);
export const contradictionSignalSchema = z.enum(['none', 'minor', 'major']);

export const articleTypeOutputSchema = z.object({
  articleType: z.enum([
    'research',
    'technical',
    'opinion',
    'review',
    'educational',
    'news',
    'essay',
    'other',
  ]),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});

export const articleStructureOutputSchema = z.object({
  hasIntroduction: z.boolean(),
  hasConclusion: z.boolean(),
  hasMethods: z.boolean(),
  hasReferences: z.boolean(),
  sectionCount: z.number().int().min(0),
  paragraphCoherence: qualitativeSignalSchema,
  argumentProgression: qualitativeSignalSchema,
  abstractRelevance: qualitativeSignalSchema,
  notes: z.string().min(1),
});

export const topicAnalysisOutputSchema = z.object({
  detectedTopics: z.array(z.string().min(1)).min(1),
  titleAbstractAlignment: qualitativeSignalSchema,
  bodyAlignment: qualitativeSignalSchema,
  categoryAlignment: qualitativeSignalSchema,
  possibleCategoryMismatch: z.boolean(),
  notes: z.string().min(1),
});

export const qualityAnalysisOutputSchema = z.object({
  clarity: qualitativeSignalSchema,
  depth: qualitativeSignalSchema,
  argumentCoherence: qualitativeSignalSchema,
  informationalValue: qualitativeSignalSchema,
  repetition: burdenSignalSchema,
  unsupportedAssertions: burdenSignalSchema,
  internalContradictions: contradictionSignalSchema,
  notes: z.string().min(1),
});

export const authorshipAnalysisOutputSchema = z.object({
  signals: z.array(z.string().min(1)),
  notes: z.string().min(1),
});

export const extractedClaimSchema = z.object({
  text: z.string().min(1),
  type: z.enum(['factual', 'interpretive', 'opinion']),
  importance: z.enum(['high', 'medium', 'low']),
  requiresVerification: z.boolean(),
});

export const claimExtractionOutputSchema = z.object({
  claims: z.array(extractedClaimSchema),
  notes: z.string().min(1),
});

export const claimEvaluationOutputSchema = z.object({
  claimText: z.string().min(1),
  status: z.enum([
    'SUPPORTED',
    'PARTIALLY_SUPPORTED',
    'DISPUTED',
    'UNVERIFIED',
    'OUTDATED',
  ]),
  relation: z.enum(['supports', 'contradicts', 'uncertain']),
  sourceUrl: z.string().nullable(),
  notes: z.string().min(1),
});

export const factEvaluationOutputSchema = z.object({
  evaluations: z.array(claimEvaluationOutputSchema),
  notes: z.string().min(1),
});

export const PIPELINE_STAGE_SCHEMAS = {
  'article-type-v1': articleTypeOutputSchema,
  'article-structure-v1': articleStructureOutputSchema,
  'topic-analysis-v1': topicAnalysisOutputSchema,
  'quality-analysis-v1': qualityAnalysisOutputSchema,
  'claim-extraction-v1': claimExtractionOutputSchema,
  'fact-evaluation-v1': factEvaluationOutputSchema,
  'authorship-analysis-v1': authorshipAnalysisOutputSchema,
} as const;

export type PipelineStageId = keyof typeof PIPELINE_STAGE_SCHEMAS;

export function stageSchema(promptId: string): StructuredParseable<unknown> {
  if (!(promptId in PIPELINE_STAGE_SCHEMAS)) {
    throw new Error(`No structured schema registered for prompt ${promptId}`);
  }

  return PIPELINE_STAGE_SCHEMAS[promptId as PipelineStageId];
}
