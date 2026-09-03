import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const extraPath = resolve(root, '.bin');
const env = {
  ...process.env,
  PATH: `${extraPath}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH ?? ''}`,
};

const turbo = spawnSync('corepack', ['pnpm', 'exec', 'turbo', 'typecheck'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

if (turbo.status === 0) {
  process.exit(0);
}

process.stderr.write('turbo typecheck failed; falling back to per-package tsc\n');

const packages = spawnSync('corepack', ['pnpm', '-r', '--filter', '!@aip/database', 'typecheck'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

if (packages.status !== 0) {
  process.exit(packages.status ?? 1);
}

const database = spawnSync('corepack', ['pnpm', '--filter', '@aip/database', 'exec', 'tsc', '--noEmit'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: true,
});

process.exit(database.status ?? 1);
