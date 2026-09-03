import {
  OBSERVABILITY_LIMITS,
  assembleObservabilityDashboard,
  type ObservabilityRepository,
  type UserRepository,
} from '@aip/domain';
import { requireObserver } from '../observability-access';
import {
  toObservabilityDashboardView,
  type InfrastructureHealthView,
  type ObservabilityDashboardView,
} from '../observability-views';
import type { Clock } from '../ports';
import type { UseCase } from '../use-case';

export interface InfrastructureHealthProbe {
  check(): Promise<InfrastructureHealthView>;
}

export interface GetObservabilityDashboardInput {
  readonly actorUserId: string;
}

export class GetObservabilityDashboardUseCase
  implements UseCase<GetObservabilityDashboardInput, ObservabilityDashboardView>
{
  public constructor(
    private readonly users: UserRepository,
    private readonly observability: ObservabilityRepository,
    private readonly health: InfrastructureHealthProbe,
    private readonly clock: Clock,
  ) {}

  public async execute(input: GetObservabilityDashboardInput): Promise<ObservabilityDashboardView> {
    await requireObserver(this.users, input.actorUserId);
    const now = this.clock.now();
    const [raw, infrastructure] = await Promise.all([
      this.observability.loadDashboard(now),
      this.health.check(),
    ]);
    const dashboard = assembleObservabilityDashboard(now, {
      ...raw,
      recentErrors: raw.recentErrors.slice(0, OBSERVABILITY_LIMITS.recentErrors),
      expensiveStages: raw.expensiveStages.slice(0, OBSERVABILITY_LIMITS.expensiveStages),
    });

    return toObservabilityDashboardView(dashboard, infrastructure);
  }
}
