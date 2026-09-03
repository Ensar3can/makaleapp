import { loadEnvConfig } from '@next/env';
import { buildSecurityHeaders } from '@aip/domain';
import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
loadEnvConfig(configDir);

const nextConfig: NextConfig = {
  transpilePackages: [
    '@aip/config',
    '@aip/database',
    '@aip/logging',
    '@aip/storage',
    '@aip/domain',
    '@aip/application',
    '@aip/auth',
    '@aip/validation',
    '@aip/queue',
    '@aip/ai',
    '@aip/research',
  ],
  async headers() {
    const production = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/:path*',
        headers: Object.entries(buildSecurityHeaders({ production })).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard/admin', permanent: false },
      { source: '/admin/articles', destination: '/dashboard/moderation', permanent: false },
      { source: '/admin/analysis', destination: '/dashboard/admin/analysis', permanent: false },
      { source: '/admin/categories', destination: '/dashboard/admin/categories', permanent: false },
      { source: '/admin/users', destination: '/dashboard/admin/users', permanent: false },
    ];
  },
};

export default nextConfig;
