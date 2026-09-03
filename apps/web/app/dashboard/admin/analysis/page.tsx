import { requireAdminPage } from '../../../../lib/auth/require-admin';
import { PageHeading } from '../../../../components/page-heading';
import { ButtonLink } from '../../../../components/ui/button';
import { DataTable } from '../../../../components/ui/data-table';
import { EmptyState } from '../../../../components/ui/empty-state';
import { getObservabilityServices } from '../../../../lib/observability/container';
import { RetryAnalysisJobButton } from './retry-button';

export const dynamic = 'force-dynamic';

export default async function AdminAnalysisJobsPage() {
  const session = await requireAdminPage();
  const jobs = await getObservabilityServices().listJobs.execute({
    actorUserId: session.userId,
  });

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Admin"
        title="Analysis jobs"
        description="Failed jobs can be requeued. Duration and estimated cost come from persisted job and run records."
        actions={
          <ButtonLink href="/dashboard/admin" variant="secondary">
            Back to observability
          </ButtonLink>
        }
      />
      {jobs.length === 0 ? (
        <EmptyState
          title="No analysis jobs yet"
          description="Submitted articles appear here after they enter the queue."
        />
      ) : (
        <DataTable caption="Analysis jobs">
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Attempts</th>
              <th>AI cost</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <p className="font-medium text-ink">{job.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted">{job.id.slice(0, 8)}</p>
                  {job.failureReason ? <p className="mt-1 text-xs text-danger">{job.failureReason}</p> : null}
                </td>
                <td>{job.status.replaceAll('_', ' ')}</td>
                <td>{job.durationMs === null ? '—' : `${Math.round(job.durationMs / 1000)}s`}</td>
                <td>{job.attemptCount}</td>
                <td>{job.estimatedCost === null ? '—' : `$${job.estimatedCost.toFixed(2)}`}</td>
                <td>{job.status === 'FAILED' ? <RetryAnalysisJobButton jobId={job.id} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
