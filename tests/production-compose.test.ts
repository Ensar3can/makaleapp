import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production compose contract', () => {
  const compose = readFileSync(resolve('docker-compose.yml'), 'utf8');
  const dockerfile = readFileSync(resolve('docker/Dockerfile'), 'utf8');
  const workflow = readFileSync(resolve('.github/workflows/ci.yml'), 'utf8');

  it('declares the production services', () => {
    for (const service of ['mssql', 'redis', 'minio', 'minio-init', 'web', 'worker']) {
      expect(compose).toMatch(new RegExp(`^  ${service}:`, 'm'));
    }
  });

  it('keeps Caddy and Mailpit behind optional profiles', () => {
    expect(compose).toContain("profiles: ['proxy']");
    expect(compose).toContain("profiles: ['mail']");
  });

  it('builds web and worker from the production Dockerfile', () => {
    expect(dockerfile).toContain('FROM base AS web');
    expect(dockerfile).toContain('FROM base AS worker');
    expect(compose).toContain('dockerfile: docker/Dockerfile');
  });

  it('runs the quality gate in CI', () => {
    expect(workflow).toContain('pnpm lint');
    expect(workflow).toContain('pnpm typecheck');
    expect(workflow).toContain('pnpm test:unit');
    expect(workflow).toContain('pnpm build');
    expect(workflow).toContain('docker compose config');
  });
});
