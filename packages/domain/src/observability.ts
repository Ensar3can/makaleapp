import type { AnalysisJob } from './analysis-job';
import type { AnalysisRun } from './analysis-run';
import { AnalysisJobStatus } from './enums';
import type { OperationalEvent } from './operational-event';

export const OBSERVABILITY_LIMITS = {
  recentErrors: 20,
  expensiveStages: 8,
  monitoredJobs: 50,
} as const;

export interface ObservabilityStageCost {
  readonly promptId: string;
  readonly totalCost: number;
  readonly callCount: number;
}

export interface ObservabilityDashboard {
  readonly generatedAt: Date;
  readonly jobsQueued: number;
  readonly jobsRunning: number;
  readonly jobsFailed: number;
  readonly jobsCompleted: number;
  readonly averageAnalysisDurationMs: number | null;
  readonly analysisSuccessRate: number | null;
  readonly aiCostToday: number;
  readonly aiCostThisMonth: number;
  readonly averageCostPerAnalysis: number | null;
  readonly averageTokensPerArticle: number | null;
  readonly articlesRequiringReview: number;
  readonly providerErrorRate: number | null;
  readonly expensiveStages: readonly ObservabilityStageCost[];
  readonly recentErrors: readonly OperationalEvent[];
  readonly workerHeartbeatAt: Date | null;
}

export interface ObservabilityRawSnapshot {
  readonly jobsQueued: number;
  readonly jobsRunning: number;
  readonly jobsFailed: number;
  readonly jobsCompleted: number;
  readonly completedDurationsMs: readonly number[];
  readonly completedRunCount: number;
  readonly failedRunCount: number;
  readonly tokenUsageSum: number;
  readonly tokenUsageCount: number;
  readonly costToday: number;
  readonly costThisMonth: number;
  readonly costCompletedSum: number;
  readonly costCompletedCount: number;
  readonly articlesRequiringReview: number;
  readonly aiProviderFailureCount: number;
  readonly expensiveStages: readonly ObservabilityStageCost[];
  readonly recentErrors: readonly OperationalEvent[];
  readonly workerHeartbeatAt: Date | null;
}

export interface MonitoredJobQuery {
  readonly status?: AnalysisJobStatus;
  readonly limit: number;
}

export interface MonitoredJobRecord {
  readonly job: AnalysisJob;
  readonly title: string;
  readonly run: AnalysisRun | null;
}

export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function analysisDurationMs(startedAt: Date | null, completedAt: Date | null): number | null {
  if (!startedAt || !completedAt) {
    return null;
  }

  const duration = completedAt.getTime() - startedAt.getTime();
  return duration >= 0 ? duration : null;
}

export function ratioOrNull(numerator: number, denominator: number): number | null {
  if (denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

export function averageOrNull(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function assembleObservabilityDashboard(
  now: Date,
  raw: ObservabilityRawSnapshot,
): ObservabilityDashboard {
  const decidedJobs = raw.jobsCompleted + raw.jobsFailed;
  const decidedRuns = raw.completedRunCount + raw.failedRunCount;

  return {
    generatedAt: now,
    jobsQueued: raw.jobsQueued,
    jobsRunning: raw.jobsRunning,
    jobsFailed: raw.jobsFailed,
    jobsCompleted: raw.jobsCompleted,
    averageAnalysisDurationMs: averageOrNull(raw.completedDurationsMs),
    analysisSuccessRate: ratioOrNull(raw.jobsCompleted, decidedJobs),
    aiCostToday: raw.costToday,
    aiCostThisMonth: raw.costThisMonth,
    averageCostPerAnalysis: ratioOrNull(raw.costCompletedSum, raw.costCompletedCount),
    averageTokensPerArticle: ratioOrNull(raw.tokenUsageSum, raw.tokenUsageCount),
    articlesRequiringReview: raw.articlesRequiringReview,
    providerErrorRate: ratioOrNull(raw.aiProviderFailureCount, decidedRuns),
    expensiveStages: raw.expensiveStages.slice(0, OBSERVABILITY_LIMITS.expensiveStages),
    recentErrors: raw.recentErrors.slice(0, OBSERVABILITY_LIMITS.recentErrors),
    workerHeartbeatAt: raw.workerHeartbeatAt,
  };
}
