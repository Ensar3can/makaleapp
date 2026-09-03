import Link from 'next/link';
import type { Metadata } from 'next';
import { ArticleCardGrid, ArticleCardRail } from '@/components/article-card';
import { ComingSoonPanel } from '@/components/coming-soon-panel';
import { PageShell } from '@/components/page-shell';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { getDiscoveryServices } from '@/lib/discovery/container';

export const metadata: Metadata = {
  title: 'Article Intelligence Platform',
  description: 'Discover published articles ranked by transparent, persisted evaluation scores.',
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const discovery = await getDiscoveryServices().homepage.execute();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="hero-mesh pointer-events-none absolute inset-0 opacity-80" />
        <div className="pointer-events-none absolute -right-24 top-8 h-72 w-72 rounded-full bg-navy/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-page px-4 py-12 md:px-12 md:py-24">
          <p className="page-kicker">Public discovery</p>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-6xl">
            Transparent article evaluation, persisted as a snapshot
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-7 text-muted">
            Published work is ranked by a stored evaluation snapshot. Overall and quality scores come
            from analysis, not from this page. AI authorship is shown as risk and confidence, never as
            a binary verdict.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/dashboard/articles/new">Submit an article</ButtonLink>
            <ButtonLink href="/articles" variant="secondary">
              Browse articles
            </ButtonLink>
          </div>
        </div>
      </section>

      <PageShell className="space-y-16 py-16 md:py-20">
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-ink">Highest scored</h2>
            <Link href="/articles?sort=overall_score" className="link-accent text-sm">
              View all
            </Link>
          </div>
          <ArticleCardRail
            articles={discovery.topRated}
            empty="No published articles are available yet."
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-ink">Recently published</h2>
            <Link href="/articles?sort=published_at" className="link-accent text-sm">
              View all
            </Link>
          </div>
          <ArticleCardGrid
            articles={discovery.recentlyPublished}
            columns={3}
            empty="No recently published articles yet."
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl text-ink">Topics</h2>
            <Link href="/categories" className="link-accent text-sm">
              View all
            </Link>
          </div>
          {discovery.categories.length === 0 ? (
            <EmptyState description="Categories will appear here once they are published." />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discovery.categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} className="block">
                    <Card interactive className="p-6">
                      <h3 className="font-serif text-xl text-ink">{category.name}</h3>
                      <p className="mt-2 text-sm text-muted">Browse published articles in this topic.</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="font-serif text-3xl text-ink">For you</h2>
          <ComingSoonPanel
            title="Personalized recommendations are not available"
            description="There is no recommendation API in v1.0. This section stays empty instead of showing invented articles. Use Highest scored and Recently published above."
            action={
              <ButtonLink href="/articles" variant="secondary">
                Browse all articles
              </ButtonLink>
            }
          />
        </section>
      </PageShell>
    </div>
  );
}
