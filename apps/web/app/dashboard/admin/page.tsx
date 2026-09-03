import { requireAdminPage } from '../../../lib/auth/require-admin';
import { PageHeading } from '../../../components/page-heading';
import { ButtonLink } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { getObservabilityServices } from '../../../lib/observability/container';

export const dynamic = 'force-dynamic';

export default async function AdminObservabilityPage() {
  const session = await requireAdminPage();
  const dashboard = await getObservabilityServices().dashboard.execute({
    actorUserId: session.userId,
  });
  const healthOk =
    dashboard.infrastructure.sqlServer &&
    dashboard.infrastructure.redis &&
    dashboard.infrastructure.objectStorage;

  return (
    <div className="space-y-8">
      <PageHeading
        kicker="Admin"
        title="Observability"
        description="Job throughput, analysis duration, and AI cost come from persisted jobs and runs. Routes never calculate article scores."
        actions={
          <ButtonLink href="/dashboard/admin/analysis">Analysis jobs</ButtonLink>
        }
      />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi label="Jobs queued" value={dashboard.jobsQueued} />
        <Kpi label="Jobs running" value={dashboard.jobsRunning} />
        <Kpi label="Jobs failed" value={dashboard.jobsFailed} accent={dashboard.jobsFailed > 0} />
        <Kpi
          label="Success rate"
          value={formatRatio(dashboard.analysisSuccessRate)}
        />
        <Kpi label="AI cost today" value={formatCost(dashboard.aiCostToday)} />
        <Kpi label="AI cost this month" value={formatCost(dashboard.aiCostThisMonth)} />
        <Kpi label="Avg tokens / article" value={formatNumber(dashboard.averageTokensPerArticle)} />
        <Kpi
          label="Avg duration"
          value={formatDuration(dashboard.averageAnalysisDurationMs)}
        />
        <Kpi label="Needs review" value={dashboard.articlesRequiringReview} />
        <Kpi
          label="Provider error rate"
          value={formatRatio(dashboard.providerErrorRate)}
        />
        <Kpi label="System health" value={healthOk ? 'Ready' : 'Degraded'} accent={!healthOk} />
        <Kpi
          label="Worker heartbeat"
          value={dashboard.workerHeartbeatAt ? formatTime(dashboard.workerHeartbeatAt) : 'None'}
        />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Most expensive stages</h2>
          {dashboard.expensiveStages.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No persisted AI usage yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {dashboard.expensiveStages.map((stage) => (
                <li key={stage.promptId} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-ink">{stage.promptId}</span>
                  <span className="text-muted">
                    {formatCost(stage.totalCost)} · {stage.callCount} calls
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Recent errors</h2>
          {dashboard.recentErrors.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No operational errors recorded.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dashboard.recentErrors.map((event) => (
                <li key={event.id} className="rounded-lg border border-line px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-muted">{event.kind}</p>
                  <p className="mt-1 text-sm text-ink">{event.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {event.status}
                    {event.requestId ? ` · ${event.requestId}` : ''} · {formatTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className={`text-2xl font-semibold ${accent ? 'text-danger' : 'text-ink'}`}>{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Card>
  );
}

function formatRatio(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function formatCost(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | null): string {
  return value === null ? '—' : value.toFixed(0);
}

function formatDuration(value: number | null): string {
  return value === null ? '—' : `${Math.round(value / 1000)}s`;
}

function formatTime(value: string): string {
  return new Date(value).toISOString().replace('T', ' ').replace('.000Z', ' UTC');
}
