import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { LocalDiskObjectStorage } from './local-disk-object-storage';

describe('LocalDiskObjectStorage', () => {
  const roots: string[] = [];

  afterEach(() => {
    for (const root of roots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createStorage(): LocalDiskObjectStorage {
    const root = mkdtempSync(join(tmpdir(), 'aip-storage-'));
    roots.push(root);
    return new LocalDiskObjectStorage(root);
  }

  it('writes, reads, and deletes an object', async () => {
    const storage = createStorage();
    const body = Buffer.from('article-bytes');

    const put = await storage.put('articles/demo.txt', body, 'text/plain');
    expect(put.size).toBe(body.byteLength);
    expect(put.checksum).toHaveLength(64);
    expect(await storage.exists('articles/demo.txt')).toBe(true);
    expect(await storage.get('articles/demo.txt')).toEqual(body);

    await storage.delete('articles/demo.txt');
    expect(await storage.exists('articles/demo.txt')).toBe(false);
  });

  it('rejects path traversal keys', async () => {
    const storage = createStorage();

    await expect(storage.put('../secret.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      'Invalid storage key',
    );
  });
});
