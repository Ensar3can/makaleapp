import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/generated/**'],
    environment: 'node',
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
