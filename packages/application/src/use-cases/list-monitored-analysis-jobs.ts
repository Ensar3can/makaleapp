import {
  AnalysisJobStatus,
  OBSERVABILITY_LIMITS,
  type ObservabilityRepository,
  type UserRepository,
} from '@aip/domain';
import { ValidationError } from '../errors';
import { requireObserver } from '../observability-access';
import { toMonitoredAnalysisJobView, type MonitoredAnalysisJobView } from '../observability-views';
import type { UseCase } from '../use-case';

export interface ListMonitoredAnalysisJobsInput {
  readonly actorUserId: string;
  readonly status?: string;
  readonly limit?: number;
}

export class ListMonitoredAnalysisJobsUseCase
  implements UseCase<ListMonitoredAnalysisJobsInput, readonly MonitoredAnalysisJobView[]>
{
  public constructor(
    private readonly users: UserRepository,
    private readonly observability: ObservabilityRepository,
  ) {}

  public async execute(
    input: ListMonitoredAnalysisJobsInput,
  ): Promise<readonly MonitoredAnalysisJobView[]> {
    await requireObserver(this.users, input.actorUserId);

    const status = parseJobStatus(input.status);
    const limit = clampLimit(input.limit);
    const records = await this.observability.listJobs({ status, limit });

    return records.map(toMonitoredAnalysisJobView);
  }
}

function parseJobStatus(value: string | undefined): AnalysisJobStatus | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const statuses = Object.values(AnalysisJobStatus);

  if (!statuses.includes(value as AnalysisJobStatus)) {
    throw new ValidationError('Analysis job status filter is invalid');
  }

  return value as AnalysisJobStatus;
}

function clampLimit(value: number | undefined): number {
  if (value === undefined) {
    return OBSERVABILITY_LIMITS.monitoredJobs;
  }

  if (!Number.isInteger(value) || value < 1) {
    throw new ValidationError('Limit must be a positive integer');
  }

  return Math.min(value, OBSERVABILITY_LIMITS.monitoredJobs);
}
