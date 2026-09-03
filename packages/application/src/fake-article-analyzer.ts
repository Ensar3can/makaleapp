import type { ArticleAnalysisOutcome, ArticleAnalyzer, AnalyzeArticleCommand } from './ports';

export const FAKE_ANALYZER_IDENTITY = {
  pipelineVersion: 'fake-pipeline-1',
  promptVersion: 'fake-prompt-1',
  modelProvider: 'fake',
  modelName: 'deterministic',
} as const;

export interface FakeArticleAnalyzerFailure {
  readonly reason: string;
  readonly retryable: boolean;
  readonly times: number;
}

export class FakeArticleAnalyzer implements ArticleAnalyzer {
  private failureCount = 0;

  public constructor(private readonly failure?: FakeArticleAnalyzerFailure) {}

  public async analyze(_input: AnalyzeArticleCommand): Promise<ArticleAnalysisOutcome> {
    if (this.failure && this.failureCount < this.failure.times) {
      this.failureCount += 1;
      return {
        ok: false,
        reason: this.failure.reason,
        retryable: this.failure.retryable,
      };
    }

    return {
      ok: true,
      ...FAKE_ANALYZER_IDENTITY,
      tokenUsage: 0,
      estimatedCost: 0,
    };
  }
}
