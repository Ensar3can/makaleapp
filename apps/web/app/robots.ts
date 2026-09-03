import type { MetadataRoute } from 'next';
import { getConfig } from '@aip/config';

export default function robots(): MetadataRoute.Robots {
  const origin = getConfig().APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/settings', '/api/'],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
