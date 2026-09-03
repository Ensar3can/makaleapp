import {
  analysisDurationMs,
  type AnalysisJob,
  type AnalysisRun,
  type ObservabilityDashboard,
  type OperationalEvent,
} from '@aip/domain';

export interface ObservabilityDashboardView {
  readonly generatedAt: string;
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
  readonly expensiveStages: readonly {
    readonly promptId: string;
    readonly totalCost: number;
    readonly callCount: number;
  }[];
  readonly recentErrors: readonly OperationalEventView[];
  readonly workerHeartbeatAt: string | null;
  readonly infrastructure: InfrastructureHealthView;
}

export interface InfrastructureHealthView {
  readonly sqlServer: boolean;
  readonly redis: boolean;
  readonly objectStorage: boolean;
}

export interface OperationalEventView {
  readonly id: string;
  readonly kind: string;
  readonly requestId: string | null;
  readonly status: string;
  readonly message: string;
  readonly durationMs: number | null;
  readonly createdAt: string;
}

export interface MonitoredAnalysisJobView {
  readonly id: string;
  readonly articleId: string;
  readonly title: string;
  readonly status: AnalysisJob['status'];
  readonly attemptCount: number;
  readonly queuedAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly durationMs: number | null;
  readonly estimatedCost: number | null;
  readonly tokenUsage: number | null;
  readonly pipelineVersion: string | null;
  readonly promptVersion: string | null;
  readonly modelProvider: string | null;
  readonly modelName: string | null;
  readonly failureReason: string | null;
}

export function toObservabilityDashboardView(
  dashboard: ObservabilityDashboard,
  infrastructure: InfrastructureHealthView,
): ObservabilityDashboardView {
  return {
    generatedAt: dashboard.generatedAt.toISOString(),
    jobsQueued: dashboard.jobsQueued,
    jobsRunning: dashboard.jobsRunning,
    jobsFailed: dashboard.jobsFailed,
    jobsCompleted: dashboard.jobsCompleted,
    averageAnalysisDurationMs: dashboard.averageAnalysisDurationMs,
    analysisSuccessRate: dashboard.analysisSuccessRate,
    aiCostToday: dashboard.aiCostToday,
    aiCostThisMonth: dashboard.aiCostThisMonth,
    averageCostPerAnalysis: dashboard.averageCostPerAnalysis,
    averageTokensPerArticle: dashboard.averageTokensPerArticle,
    articlesRequiringReview: dashboard.articlesRequiringReview,
    providerErrorRate: dashboard.providerErrorRate,
    expensiveStages: dashboard.expensiveStages,
    recentErrors: dashboard.recentErrors.map(toOperationalEventView),
    workerHeartbeatAt: dashboard.workerHeartbeatAt?.toISOString() ?? null,
    infrastructure,
  };
}

export function toOperationalEventView(event: OperationalEvent): OperationalEventView {
  return {
    id: event.id,
    kind: event.kind,
    requestId: event.requestId,
    status: event.status,
    message: event.message,
    durationMs: event.durationMs,
    createdAt: event.createdAt.toISOString(),
  };
}

export function toMonitoredAnalysisJobView(input: {
  readonly job: AnalysisJob;
  readonly title: string;
  readonly run: AnalysisRun | null;
}): MonitoredAnalysisJobView {
  return {
    id: input.job.id,
    articleId: input.job.articleId,
    title: input.title,
    status: input.job.status,
    attemptCount: input.job.attemptCount,
    queuedAt: input.job.queuedAt.toISOString(),
    startedAt: input.job.startedAt?.toISOString() ?? null,
    completedAt: input.job.completedAt?.toISOString() ?? null,
    durationMs: analysisDurationMs(input.job.startedAt, input.job.completedAt),
    estimatedCost: input.run?.estimatedCost ?? null,
    tokenUsage: input.run?.tokenUsage ?? null,
    pipelineVersion: input.run?.pipelineVersion ?? null,
    promptVersion: input.run?.promptVersion ?? null,
    modelProvider: input.run?.modelProvider ?? null,
    modelName: input.run?.modelName ?? null,
    failureReason: input.job.failureReason,
  };
}
