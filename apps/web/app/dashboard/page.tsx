import Link from 'next/link';
import { getArticleServices } from '../../lib/articles/container';
import { requirePageSession } from '../../lib/auth/session';
import { ComingSoonPanel } from '../../components/coming-soon-panel';
import { PageHeading } from '../../components/page-heading';
import { ResendVerificationButton } from '../../components/resend-verification-button';
import { StatusBadge } from '../../components/status-badge';
import { ButtonLink } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/empty-state';

export default async function DashboardPage() {
  const session = await requirePageSession();
  const articles = await getArticleServices().listAuthorArticles.execute({
    actorUserId: session.userId,
  });
  const counts = countByStatus(articles.map((article) => article.status));

  return (
    <div className="space-y-8">
      <PageHeading
        kicker="Signed in"
        title={`Hello${session.profile ? `, ${session.profile.displayName}` : ''}`}
        description={
          <>
            Role <strong>{session.user.role}</strong>
            {session.user.emailVerified ? '' : '. Verify your email before submitting an article.'}
          </>
        }
        actions={
          <ButtonLink href="/dashboard/articles/new">New article</ButtonLink>
        }
      />
      {session.user.emailVerified ? null : (
        <Card className="p-6">
          <p className="font-medium text-ink">Email not verified</p>
          <p className="mt-1 text-sm text-muted">
            Submit and publish stay blocked until this address is confirmed.
          </p>
          <div className="mt-4">
            <ResendVerificationButton />
          </div>
        </Card>
      )}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-2xl font-semibold text-ink">{item.count}</p>
            <p className="mt-1 text-sm text-muted">{item.label}</p>
          </Card>
        ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">Recent articles</h2>
          <Link href="/dashboard/articles" className="link-accent text-sm">
            View all
          </Link>
        </div>
        {articles.length === 0 ? (
          <EmptyState
            title="You have not created an article yet"
            action={<ButtonLink href="/dashboard/articles/new">Create a draft</ButtonLink>}
          />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            <ul>
            {articles.slice(0, 8).map((article) => (
              <li key={article.id} className="flex items-start justify-between gap-4 px-4 py-4 sm:items-center sm:px-5">
                <div className="min-w-0">
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="link-accent break-words">
                    {article.title}
                  </Link>
                  <p className="text-xs text-muted">
                    v{article.currentVersionNumber}
                    {' · '}
                    <Link href={`/dashboard/articles/${article.id}/analysis`} className="link-accent">
                      Analysis
                    </Link>
                  </p>
                </div>
                <span className="shrink-0">
                  <StatusBadge status={article.status} />
                </span>
              </li>
            ))}
            </ul>
          </Card>
        )}
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <ComingSoonPanel
          title="Activity timeline is not stored"
          description="There is no author activity feed. Recent articles above are the current record. This panel does not invent events."
        />
        <ComingSoonPanel
          title="Score trend is not aggregated"
          description="v1.0 does not compute a six-month average. Individual scores stay on each article ScoreSnapshot and are never calculated here."
        />
      </section>
    </div>
  );
}

function countByStatus(statuses: readonly string[]) {
  const draft = statuses.filter((status) => status === 'DRAFT').length;
  const queued = statuses.filter(
    (status) => status === 'SUBMITTED' || status === 'QUEUED_FOR_ANALYSIS' || status === 'PROCESSING',
  ).length;
  const published = statuses.filter((status) => status === 'PUBLISHED').length;
  return [
    { label: 'Total', count: statuses.length },
    { label: 'Drafts', count: draft },
    { label: 'In analysis', count: queued },
    { label: 'Published', count: published },
  ];
}
