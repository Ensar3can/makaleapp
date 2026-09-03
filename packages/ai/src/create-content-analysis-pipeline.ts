import type { ArticleType } from '@aip/domain';
import { ArticleAnalysisPipeline, type ArticleAnalysisPipelineDeps } from './article-analysis-pipeline';
import { StylometricAuthorshipDetector } from './stylometric-authorship-detector';
import { FakeAIProvider } from './fake-ai-provider';
import { createFoundationPromptRegistry } from './prompt-registry';
import type { PipelineResult } from './types';
import { InMemoryUsageTracker } from './usage-tracker';

export interface ContentAnalysisPipelineOptions {
  readonly provider?: ArticleAnalysisPipelineDeps['provider'];
  readonly research?: ArticleAnalysisPipelineDeps['research'];
  readonly authorship?: ArticleAnalysisPipelineDeps['authorship'];
  readonly usage?: ArticleAnalysisPipelineDeps['usage'];
}

export function createContentAnalysisPipeline(
  options: ContentAnalysisPipelineOptions = {},
): ArticleAnalysisPipeline {
  return new ArticleAnalysisPipeline({
    provider: options.provider ?? new FakeAIProvider(),
    research: options.research ?? {
      search: async () => [],
      lookup: async (url) => ({ url, exists: false, blocked: false }),
    },
    authorship: options.authorship ?? new StylometricAuthorshipDetector(),
    prompts: createFoundationPromptRegistry(),
    usage: options.usage ?? new InMemoryUsageTracker(),
  });
}

export function createFakeAnalysisPipeline(
  options: ContentAnalysisPipelineOptions = {},
): ArticleAnalysisPipeline {
  return createContentAnalysisPipeline(options);
}

export type FakeAnalysisPipelineOptions = ContentAnalysisPipelineOptions;

export type AnalyzerOutcome =
  | {
      readonly ok: true;
      readonly pipelineVersion: string;
      readonly promptVersion: string;
      readonly modelProvider: string;
      readonly modelName: string;
      readonly tokenUsage: number;
      readonly estimatedCost: number;
      readonly articleType: ArticleType;
      readonly detectedTopics: readonly string[];
      readonly metrics: Extract<PipelineResult, { ok: true }>['metrics'];
      readonly evidence: Extract<PipelineResult, { ok: true }>['evidence'];
      readonly sources: Extract<PipelineResult, { ok: true }>['sources'];
      readonly usageRecords: Extract<PipelineResult, { ok: true }>['usageRecords'];
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly retryable: boolean;
    };

export function toAnalyzerOutcome(result: PipelineResult): AnalyzerOutcome {
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    pipelineVersion: result.pipelineVersion,
    promptVersion: result.promptVersion,
    modelProvider: result.modelProvider,
    modelName: result.modelName,
    tokenUsage: result.tokenUsage,
    estimatedCost: result.estimatedCost,
    articleType: result.articleType,
    detectedTopics: result.detectedTopics,
    metrics: result.metrics,
    evidence: result.evidence,
    sources: result.sources,
    usageRecords: result.usageRecords,
  };
}
