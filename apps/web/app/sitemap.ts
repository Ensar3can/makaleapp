import type { MetadataRoute } from 'next';
import { getConfig } from '@aip/config';
import { getDiscoveryServices } from '../lib/discovery/container';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getConfig().APP_URL;
  const entries = await getDiscoveryServices().listSitemap.execute();
  const categories = await getDiscoveryServices().listPublicCategories.execute();

  return [
    { url: origin, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${origin}/articles`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${origin}/categories`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${origin}/search`, changeFrequency: 'weekly', priority: 0.6 },
    ...categories.map((category) => ({
      url: `${origin}/categories/${category.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...entries.map((entry) => ({
      url: `${origin}/articles/${entry.slug}`,
      lastModified: entry.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
