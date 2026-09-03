export const ANALYSIS_JOB_POLICY = {
  maxAttempts: 3,
  retryDelayMs: 2_000,
  staleRunningMs: 5 * 60 * 1000,
} as const;

export const ANALYZE_ARTICLE_JOB = 'analyze-article';

export interface AnalyzeArticlePayload {
  readonly analysisJobId: string;
}

export function isAnalyzeArticlePayload(value: unknown): value is AnalyzeArticlePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'analysisJobId' in value &&
    typeof value.analysisJobId === 'string' &&
    value.analysisJobId.length > 0
  );
}
