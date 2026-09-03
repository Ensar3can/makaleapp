import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { IObjectStorage, ObjectPutResult } from './i-object-storage';
import { assertSafeStorageKey } from './storage-key';

export class LocalDiskObjectStorage implements IObjectStorage {
  public constructor(private readonly rootDirectory: string) {}

  public async put(key: string, body: Buffer, _contentType: string): Promise<ObjectPutResult> {
    const filePath = this.resolveKey(assertSafeStorageKey(key));
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body);

    return {
      storageKey: key,
      size: body.byteLength,
      checksum: createHash('sha256').update(body).digest('hex'),
    };
  }

  public async get(key: string): Promise<Buffer> {
    return readFile(this.resolveKey(assertSafeStorageKey(key)));
  }

  public async delete(key: string): Promise<void> {
    await rm(this.resolveKey(assertSafeStorageKey(key)), { force: true });
  }

  public async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolveKey(assertSafeStorageKey(key)));
      return true;
    } catch {
      return false;
    }
  }

  private resolveKey(key: string): string {
    if (path.isAbsolute(key)) {
      throw new Error('Invalid storage key');
    }

    const resolved = path.resolve(this.rootDirectory, key);
    const root = path.resolve(this.rootDirectory);

    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error('Invalid storage key');
    }

    return resolved;
  }
}
