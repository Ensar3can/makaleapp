import { describe, expect, it } from 'vitest';
import {
  createObjectStorage,
  createObjectStorageFromConfig,
  objectStorageOptionsFromConfig,
} from './create-object-storage';
import { LocalDiskObjectStorage } from './local-disk-object-storage';
import { S3CompatibleObjectStorage } from './s3-compatible-object-storage';

describe('createObjectStorage', () => {
  it('returns local disk storage for the local-disk driver', () => {
    const storage = createObjectStorage({
      driver: 'local-disk',
      rootDirectory: '.data/storage',
    });

    expect(storage).toBeInstanceOf(LocalDiskObjectStorage);
  });

  it('returns S3-compatible storage for the s3 driver', () => {
    const storage = createObjectStorage({
      driver: 's3',
      bucket: 'aip',
      region: 'us-east-1',
      accessKey: 'minio',
      secretKey: 'minio-secret',
      endpoint: 'http://127.0.0.1:9000',
      forcePathStyle: true,
    });

    expect(storage).toBeInstanceOf(S3CompatibleObjectStorage);
  });

  it('maps config fields onto the selected driver', () => {
    expect(
      objectStorageOptionsFromConfig({
        OBJECT_STORAGE_DRIVER: 'local-disk',
        OBJECT_STORAGE_ROOT: '.data/storage',
        OBJECT_STORAGE_BUCKET: 'aip',
        OBJECT_STORAGE_REGION: 'us-east-1',
        OBJECT_STORAGE_ACCESS_KEY: '',
        OBJECT_STORAGE_SECRET_KEY: '',
        OBJECT_STORAGE_ENDPOINT: '',
        objectStorageForcePathStyle: true,
      }),
    ).toEqual({
      driver: 'local-disk',
      rootDirectory: '.data/storage',
    });

    expect(
      createObjectStorageFromConfig({
        OBJECT_STORAGE_DRIVER: 'local-disk',
        OBJECT_STORAGE_ROOT: '.data/storage',
        OBJECT_STORAGE_BUCKET: 'aip',
        OBJECT_STORAGE_REGION: 'us-east-1',
        OBJECT_STORAGE_ACCESS_KEY: '',
        OBJECT_STORAGE_SECRET_KEY: '',
        OBJECT_STORAGE_ENDPOINT: '',
        objectStorageForcePathStyle: true,
      }),
    ).toBeInstanceOf(LocalDiskObjectStorage);
  });
});
