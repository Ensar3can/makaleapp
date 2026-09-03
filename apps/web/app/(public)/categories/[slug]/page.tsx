import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CategoryNotFoundError } from '@aip/domain';
import { getConfig } from '@aip/config';
import { ArticleCardList } from '@/components/article-card';
import { DiscoveryFilters } from '@/components/discovery-filters';
import { PageHeading } from '@/components/page-heading';
import { PageShell } from '@/components/page-shell';
import { CatalogLayout } from '@/components/ui/catalog-layout';
import { Pagination } from '@/components/ui/pagination';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { discoveryQueryFromSearchParams, firstQueryValue, nextPageHref } from '@/lib/discovery/query';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const page = await getDiscoveryServices().getPublicCategory.execute({ slug });
    return {
      title: page.category.name,
      description: `Published articles in ${page.category.name}, ranked by persisted evaluation score.`,
      alternates: { canonical: `${getConfig().APP_URL}/categories/${page.category.slug}` },
    };
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return { title: 'Category not found' };
    }

    throw error;
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const queryParams = await searchParams;
  const query = discoveryQueryFromSearchParams(queryParams);

  try {
    const page = await getDiscoveryServices().getPublicCategory.execute({
      slug,
      sort: query.sort,
      cursor: query.cursor,
      minOverallScore: query.minOverallScore,
      maxOverallScore: query.maxOverallScore,
      query: query.query,
      limit: query.limit,
    });
    const nextHref = nextPageHref(`/categories/${page.category.slug}`, queryParams, page.articles.nextCursor);

    return (
      <PageShell>
        <div>
          <CatalogLayout
            sidebar={
              <DiscoveryFilters
                action={`/categories/${page.category.slug}`}
                layout="sidebar"
                categories={[page.category]}
                hideCategory
                values={{
                  q: query.query,
                  minScore: firstQueryValue(queryParams.minScore),
                  maxScore: firstQueryValue(queryParams.maxScore),
                  sort: query.sort,
                }}
              />
            }
          >
            <PageHeading
              kicker="Category"
              title={page.category.name}
              description="Published articles in this category, ranked from the ScoreSnapshot."
            />
            <ArticleCardList
              articles={page.articles.items}
              empty="No published articles in this category yet."
            />
            <Pagination href={nextHref} />
          </CatalogLayout>
        </div>
      </PageShell>
    );
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      notFound();
    }

    throw error;
  }
}
