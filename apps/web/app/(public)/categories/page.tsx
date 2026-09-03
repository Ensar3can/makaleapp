import Link from 'next/link';
import type { Metadata } from 'next';
import { getDiscoveryServices } from '@/lib/discovery/container';
import { PageHeading } from '@/components/page-heading';
import { PageShell } from '@/components/page-shell';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse published article categories.',
};

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const categories = await getDiscoveryServices().listPublicCategories.execute();

  return (
    <PageShell>
      <div className="space-y-8">
        <PageHeading
          kicker="Catalog"
          title="Categories"
          description="Active topics used by published articles. Category pages only list work with a current ScoreSnapshot."
        />
        {categories.length === 0 ? (
          <EmptyState
            title="No categories are published yet"
            description="Topics appear here after they are activated."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/categories/${category.slug}`} className="block">
                  <Card interactive className="p-6">
                    <h2 className="font-serif text-xl text-ink">{category.name}</h2>
                    <p className="mt-2 text-sm text-muted">View published articles</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
