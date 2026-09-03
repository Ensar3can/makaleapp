import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/generated/**',
      '**/*.mssql.test.ts',
      'tests/infra.smoke.test.ts',
      'tests/auth.integration.test.ts',
    ],
    environment: 'node',
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
