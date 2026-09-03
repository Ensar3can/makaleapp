import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from '@aip/config';
import { probeRedis, probeSqlServer } from '@aip/database';
import { LocalDiskObjectStorage } from '@aip/storage';

const extraSqlPath = 'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn';

if (process.platform === 'win32' && !process.env.PATH?.includes('SQL Server')) {
  process.env.PATH = `${process.env.PATH ?? ''};${extraSqlPath}`;
}

describe('infrastructure smoke tests', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('connects to the local SQL Server instance', async () => {
    const config = loadConfig(process.env);
    const result = await probeSqlServer(config.SQLSERVER_INSTANCE);

    expect(result.ok).toBe(true);
    expect(result.serverName.length).toBeGreaterThan(0);
  });

  it('probes the configured Redis driver', async () => {
    const config = loadConfig(process.env);
    const result = await probeRedis(config.REDIS_URL);

    expect(result.ok).toBe(true);
    expect(['memory', 'redis']).toContain(result.driver);
  });

  it('writes and reads through LocalDiskObjectStorage', async () => {
    const root = mkdtempSync(join(tmpdir(), 'aip-smoke-storage-'));
    roots.push(root);
    const storage = new LocalDiskObjectStorage(root);
    const body = Buffer.from('smoke-object');

    const put = await storage.put('smoke/object.txt', body, 'text/plain');
    expect(await storage.get('smoke/object.txt')).toEqual(body);
    expect(put.checksum).toHaveLength(64);
  });
});
