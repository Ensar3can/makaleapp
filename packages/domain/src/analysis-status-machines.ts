import { AnalysisJobStatus, AnalysisRunStatus } from './enums';
import { InvalidAnalysisJobStateError, InvalidAnalysisRunStateError } from './errors';

export const ANALYSIS_JOB_TRANSITIONS: Record<AnalysisJobStatus, readonly AnalysisJobStatus[]> = {
  [AnalysisJobStatus.QUEUED]: [AnalysisJobStatus.RUNNING, AnalysisJobStatus.CANCELLED],
  [AnalysisJobStatus.RUNNING]: [
    AnalysisJobStatus.COMPLETED,
    AnalysisJobStatus.FAILED,
    AnalysisJobStatus.CANCELLED,
  ],
  [AnalysisJobStatus.COMPLETED]: [],
  [AnalysisJobStatus.FAILED]: [AnalysisJobStatus.QUEUED],
  [AnalysisJobStatus.CANCELLED]: [],
};

export const ANALYSIS_RUN_TRANSITIONS: Record<AnalysisRunStatus, readonly AnalysisRunStatus[]> = {
  [AnalysisRunStatus.PENDING]: [AnalysisRunStatus.RUNNING, AnalysisRunStatus.FAILED],
  [AnalysisRunStatus.RUNNING]: [AnalysisRunStatus.COMPLETED, AnalysisRunStatus.FAILED],
  [AnalysisRunStatus.COMPLETED]: [],
  [AnalysisRunStatus.FAILED]: [],
};

export function assertAnalysisJobTransition(from: AnalysisJobStatus, to: AnalysisJobStatus): void {
  if (!ANALYSIS_JOB_TRANSITIONS[from].includes(to)) {
    throw new InvalidAnalysisJobStateError(`Cannot transition analysis job from ${from} to ${to}`);
  }
}

export function assertAnalysisRunTransition(from: AnalysisRunStatus, to: AnalysisRunStatus): void {
  if (!ANALYSIS_RUN_TRANSITIONS[from].includes(to)) {
    throw new InvalidAnalysisRunStateError(`Cannot transition analysis run from ${from} to ${to}`);
  }
}
