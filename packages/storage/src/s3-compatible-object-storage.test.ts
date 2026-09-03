import { describe, expect, it } from 'vitest';
import { InMemoryS3ObjectGateway } from './s3-object-gateway';
import { S3CompatibleObjectStorage } from './s3-compatible-object-storage';

describe('S3CompatibleObjectStorage', () => {
  function createStorage(): S3CompatibleObjectStorage {
    return new S3CompatibleObjectStorage(new InMemoryS3ObjectGateway());
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

  it('rejects path traversal keys before talking to the gateway', async () => {
    const storage = createStorage();

    await expect(storage.put('../secret.txt', Buffer.from('x'), 'text/plain')).rejects.toThrow(
      'Invalid storage key',
    );
    await expect(storage.get('/absolute.txt')).rejects.toThrow('Invalid storage key');
    await expect(storage.delete('..\\windows')).rejects.toThrow('Invalid storage key');
  });
});
