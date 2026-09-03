import { AwsS3ObjectGateway } from './aws-s3-object-gateway';
import type { IObjectStorage } from './i-object-storage';
import { LocalDiskObjectStorage } from './local-disk-object-storage';
import { S3CompatibleObjectStorage } from './s3-compatible-object-storage';

export type ObjectStorageOptions =
  | {
      driver: 'local-disk';
      rootDirectory: string;
    }
  | {
      driver: 's3';
      bucket: string;
      region: string;
      accessKey: string;
      secretKey: string;
      endpoint?: string;
      forcePathStyle: boolean;
    };

export interface ObjectStorageConfigInput {
  OBJECT_STORAGE_DRIVER: 'local-disk' | 's3';
  OBJECT_STORAGE_ROOT: string;
  OBJECT_STORAGE_BUCKET: string;
  OBJECT_STORAGE_REGION: string;
  OBJECT_STORAGE_ACCESS_KEY: string;
  OBJECT_STORAGE_SECRET_KEY: string;
  OBJECT_STORAGE_ENDPOINT: string;
  objectStorageForcePathStyle: boolean;
}

export function objectStorageOptionsFromConfig(config: ObjectStorageConfigInput): ObjectStorageOptions {
  if (config.OBJECT_STORAGE_DRIVER === 'local-disk') {
    return {
      driver: 'local-disk',
      rootDirectory: config.OBJECT_STORAGE_ROOT,
    };
  }

  return {
    driver: 's3',
    bucket: config.OBJECT_STORAGE_BUCKET,
    region: config.OBJECT_STORAGE_REGION,
    accessKey: config.OBJECT_STORAGE_ACCESS_KEY,
    secretKey: config.OBJECT_STORAGE_SECRET_KEY,
    endpoint: config.OBJECT_STORAGE_ENDPOINT,
    forcePathStyle: config.objectStorageForcePathStyle,
  };
}

export function createObjectStorageFromConfig(config: ObjectStorageConfigInput): IObjectStorage {
  return createObjectStorage(objectStorageOptionsFromConfig(config));
}

export function createObjectStorage(options: ObjectStorageOptions): IObjectStorage {
  if (options.driver === 'local-disk') {
    return new LocalDiskObjectStorage(options.rootDirectory);
  }

  return new S3CompatibleObjectStorage(
    new AwsS3ObjectGateway({
      bucket: options.bucket,
      region: options.region,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
    }),
  );
}
