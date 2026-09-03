import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/.data/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/generated/**',
      'masterplan.md',
      '**/next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/include': ['apps/**/*', 'packages/**/*'],
      'boundaries/elements': [
        { type: 'domain', pattern: 'packages/domain/**' },
        { type: 'application', pattern: 'packages/application/**' },
        { type: 'validation', pattern: 'packages/validation/**' },
        { type: 'config', pattern: 'packages/config/**' },
        { type: 'logging', pattern: 'packages/logging/**' },
        { type: 'testing', pattern: 'packages/testing/**' },
        { type: 'database', pattern: 'packages/database/**' },
        { type: 'ai', pattern: 'packages/ai/**' },
        { type: 'research', pattern: 'packages/research/**' },
        { type: 'storage', pattern: 'packages/storage/**' },
        { type: 'queue', pattern: 'packages/queue/**' },
        { type: 'auth', pattern: 'packages/auth/**' },
        { type: 'cache', pattern: 'packages/cache/**' },
        { type: 'web', pattern: 'apps/web/**' },
        { type: 'worker', pattern: 'apps/worker/**' },
      ],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'application', allow: ['application', 'domain'] },
            { from: 'validation', allow: ['validation'] },
            { from: 'config', allow: ['config'] },
            { from: 'logging', allow: ['logging'] },
            { from: 'testing', allow: ['testing'] },
            { from: 'database', allow: ['database', 'domain', 'config', 'logging', 'auth'] },
            { from: 'ai', allow: ['ai', 'domain', 'validation'] },
            { from: 'research', allow: ['research', 'domain'] },
            { from: 'storage', allow: ['storage'] },
            { from: 'queue', allow: ['queue'] },
            { from: 'auth', allow: ['auth', 'application', 'domain', 'logging', 'config'] },
            { from: 'cache', allow: ['cache', 'application'] },
            {
              from: 'web',
              allow: [
                'application',
                'domain',
                'config',
                'validation',
                'logging',
                'database',
                'storage',
                'auth',
                'cache',
              ],
            },
            {
              from: 'worker',
              allow: [
                'application',
                'domain',
                'config',
                'logging',
                'queue',
                'ai',
                'research',
                'database',
                'storage',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'prisma', message: 'Domain must not import Prisma.' },
            { name: '@prisma/client', message: 'Domain must not import Prisma.' },
            { name: 'next', message: 'Domain must not import Next.js.' },
            { name: 'react', message: 'Domain must not import React.' },
            { name: 'ioredis', message: 'Domain must not import Redis clients.' },
            { name: 'bullmq', message: 'Domain must not import BullMQ.' },
            { name: 'openai', message: 'Domain must not import AI SDKs.' },
          ],
          patterns: [
            { group: ['next/*', 'react-dom', 'react-dom/*', '@aws-sdk/*'], message: 'Domain must not import infrastructure.' },
          ],
        },
      ],
    },
  },
);
