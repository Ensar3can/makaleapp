import Link from 'next/link';
import { PageHeading } from '../../../components/page-heading';
import { articleStatusLabel, StatusBadge } from '../../../components/status-badge';
import { DataTable } from '../../../components/ui/data-table';
import { EmptyState } from '../../../components/ui/empty-state';
import { getModerationServices } from '../../../lib/moderation/container';
import { requireModeratorPage } from '../../../lib/auth/require-moderator';

export const dynamic = 'force-dynamic';

export default async function ModerationQueuePage() {
  const session = await requireModeratorPage();
  const items = await getModerationServices().listQueue.execute({
    actorUserId: session.userId,
  });

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Moderation"
        title="Review queue"
        description="Flagged articles wait here. Scores come from the persisted ScoreSnapshot. Authorship is a risk estimate, not a verdict."
      />
      {items.length === 0 ? (
        <EmptyState
          title="No articles require review"
          description="Automatic flags and manual reports appear in this queue."
        />
      ) : (
        <DataTable caption="Moderation queue">
          <thead>
            <tr>
              <th>Article</th>
              <th>Author</th>
              <th>Snapshot</th>
              <th>Flags</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/dashboard/moderation/${item.id}`} className="link-accent">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{item.slug}</p>
                </td>
                <td>{item.authorDisplayName}</td>
                <td>
                  {item.overallScore === null ? '—' : `Overall ${item.overallScore.toFixed(0)}`}
                  {item.authorshipRisk === null ? null : (
                    <span className="mt-1 block text-xs text-muted">
                      Authorship risk {item.authorshipRisk.toFixed(0)} · confidence{' '}
                      {item.authorshipConfidence?.toFixed(0)}
                    </span>
                  )}
                </td>
                <td className="text-xs">
                  {item.flags.length === 0
                    ? 'Manual flag'
                    : item.flags.map((flag) => flag.code.replaceAll('_', ' ').toLowerCase()).join(', ')}
                </td>
                <td>
                  <StatusBadge status={item.status} />
                  <span className="sr-only">{articleStatusLabel(item.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}
