import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const clientDir = resolve(root, 'packages/database/src/generated/client');
const result = spawnSync('corepack', ['pnpm', '--filter', '@aip/database', 'prisma:generate'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status === 0) {
  process.exit(0);
}

const hasClient = existsSync(resolve(clientDir, 'index.js')) || existsSync(resolve(clientDir, 'index.d.ts'));

if (hasClient) {
  process.stderr.write('prisma generate failed; reusing the existing generated client\n');
  process.exit(0);
}

process.exit(result.status ?? 1);
