import type { Metadata } from 'next';
import { RateLimitedError } from '@aip/application';
import { ArticleCardList } from '@/components/article-card';
import { DiscoveryFilters } from '@/components/discovery-filters';
import { PageHeading } from '@/components/page-heading';
import { PageShell } from '@/components/page-shell';
import { CatalogLayout } from '@/components/ui/catalog-layout';
import { Pagination } from '@/components/ui/pagination';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { discoveryQueryFromSearchParams, firstQueryValue, nextPageHref } from '@/lib/discovery/query';
import { requestClientIp } from '@/lib/request-ip';

export const metadata: Metadata = {
  title: 'Published articles',
  description: 'Browse published articles by evaluation score, recency, category, and search.',
};

export const dynamic = 'force-dynamic';

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = discoveryQueryFromSearchParams(params);
  const services = getDiscoveryServices();
  const clientIp = await requestClientIp();

  try {
    const [page, categories] = await Promise.all([
      services.search.execute({ ...query, clientIp }),
      services.listPublicCategories.execute(),
    ]);
    const nextHref = nextPageHref('/articles', params, page.nextCursor);

    return (
      <PageShell>
        <div>
          <CatalogLayout
            sidebar={
              <DiscoveryFilters
                action="/articles"
                layout="sidebar"
                categories={categories}
                values={{
                  q: query.query,
                  category: query.categorySlug,
                  minScore: firstQueryValue(params.minScore),
                  maxScore: firstQueryValue(params.maxScore),
                  sort: query.sort,
                }}
              />
            }
          >
            <PageHeading
              kicker="Catalog"
              title="Published articles"
              description="Ranked by the persisted ScoreSnapshot. This page never calculates overall or quality scores."
            />
            <p className="text-sm text-muted" aria-live="polite">
              {page.items.length === 0
                ? 'No articles on this page.'
                : `${page.items.length} article${page.items.length === 1 ? '' : 's'} on this page.`}
            </p>
            <ArticleCardList articles={page.items} empty="No published articles match these filters." />
            <Pagination href={nextHref} />
          </CatalogLayout>
        </div>
      </PageShell>
    );
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return (
        <PageShell>
          <div className="space-y-4">
            <h1 className="page-title">Too many requests</h1>
            <p className="page-lede">Please wait a moment and try again.</p>
          </div>
        </PageShell>
      );
    }

    throw error;
  }
}
