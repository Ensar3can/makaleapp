import type { Metadata } from 'next';
import { RateLimitedError } from '@aip/application';
import { ArticleCardList } from '@/components/article-card';
import { DiscoveryFilters } from '@/components/discovery-filters';
import { PageHeading } from '@/components/page-heading';
import { PageShell } from '@/components/page-shell';
import { Pagination } from '@/components/ui/pagination';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { discoveryQueryFromSearchParams, firstQueryValue, nextPageHref } from '@/lib/discovery/query';
import { requestClientIp } from '@/lib/request-ip';

export const metadata: Metadata = {
  title: 'Search articles',
  description: 'Search published articles by title, abstract, category, and evaluation score.',
};

export const dynamic = 'force-dynamic';

export default async function SearchPage({
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
    const nextHref = nextPageHref('/search', params, page.nextCursor);

    return (
      <PageShell>
        <div className="space-y-8">
          <PageHeading
            kicker="Search"
            title="Advanced search"
            description="Search looks at published titles and abstracts. Score filters use the persisted snapshot."
          />
          <DiscoveryFilters
            action="/search"
            categories={categories}
            values={{
              q: query.query,
              category: query.categorySlug,
              minScore: firstQueryValue(params.minScore),
              maxScore: firstQueryValue(params.maxScore),
              sort: query.sort,
            }}
          />
          <p className="text-sm text-muted" aria-live="polite">
            {page.items.length === 0
              ? 'No matching articles on this page.'
              : `${page.items.length} result${page.items.length === 1 ? '' : 's'} on this page.`}
          </p>
          <ArticleCardList articles={page.items} empty="No published articles matched that search." />
          <Pagination href={nextHref} />
        </div>
      </PageShell>
    );
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return (
        <PageShell>
          <div className="space-y-4">
            <h1 className="page-title">Too many searches</h1>
            <p className="page-lede">Please wait a moment and try again.</p>
          </div>
        </PageShell>
      );
    }

    throw error;
  }
}
