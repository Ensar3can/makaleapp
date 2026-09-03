import { createHash } from 'node:crypto';
import type { IObjectStorage, ObjectPutResult } from './i-object-storage';
import type { S3ObjectGateway } from './s3-object-gateway';
import { assertSafeStorageKey } from './storage-key';

export class S3CompatibleObjectStorage implements IObjectStorage {
  public constructor(private readonly gateway: S3ObjectGateway) {}

  public async put(key: string, body: Buffer, contentType: string): Promise<ObjectPutResult> {
    const storageKey = assertSafeStorageKey(key);
    await this.gateway.putObject({ key: storageKey, body, contentType });

    return {
      storageKey,
      size: body.byteLength,
      checksum: createHash('sha256').update(body).digest('hex'),
    };
  }

  public async get(key: string): Promise<Buffer> {
    return this.gateway.getObject(assertSafeStorageKey(key));
  }

  public async delete(key: string): Promise<void> {
    await this.gateway.deleteObject(assertSafeStorageKey(key));
  }

  public async exists(key: string): Promise<boolean> {
    return this.gateway.objectExists(assertSafeStorageKey(key));
  }
}
