import Link from 'next/link';
import { getArticleServices } from '../../../lib/articles/container';
import { requirePageSession } from '../../../lib/auth/session';
import { PageHeading } from '../../../components/page-heading';
import { articleStatusLabel, StatusBadge } from '../../../components/status-badge';
import { ButtonLink } from '../../../components/ui/button';
import { DataTable } from '../../../components/ui/data-table';
import { EmptyState } from '../../../components/ui/empty-state';

export default async function AuthorArticlesPage() {
  const session = await requirePageSession();
  const articles = await getArticleServices().listAuthorArticles.execute({
    actorUserId: session.userId,
  });

  return (
    <div className="space-y-6">
      <PageHeading
        kicker="Workspace"
        title="My articles"
        actions={<ButtonLink href="/dashboard/articles/new">New article</ButtonLink>}
      />
      {articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Create a draft, then submit it for analysis."
          action={<ButtonLink href="/dashboard/articles/new">Create your first draft</ButtonLink>}
        />
      ) : (
        <DataTable caption="Your articles">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Version</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.id}>
                <td>
                  <Link href={`/dashboard/articles/${article.id}/edit`} className="link-accent">
                    {article.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {article.categories.map((category) => category.name).join(', ') || 'Uncategorized'}
                    {' · '}
                    <Link href={`/dashboard/articles/${article.id}/analysis`} className="link-accent">
                      Analysis
                    </Link>
                    {article.status === 'PUBLISHED' ? (
                      <>
                        {' · '}
                        <Link href={`/articles/${article.slug}`} className="link-accent">
                          Public page
                        </Link>
                      </>
                    ) : null}
                  </p>
                </td>
                <td>
                  <StatusBadge status={article.status} />
                  <span className="sr-only">{articleStatusLabel(article.status)}</span>
                </td>
                <td>v{article.currentVersionNumber}</td>
                <td>{new Date(article.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
