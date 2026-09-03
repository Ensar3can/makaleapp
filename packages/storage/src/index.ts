export type { IObjectStorage, ObjectPutResult } from './i-object-storage';
export type { ObjectStorageConfigInput, ObjectStorageOptions } from './create-object-storage';
export {
  createObjectStorage,
  createObjectStorageFromConfig,
  objectStorageOptionsFromConfig,
} from './create-object-storage';
export { LocalDiskObjectStorage } from './local-disk-object-storage';
export { S3CompatibleObjectStorage } from './s3-compatible-object-storage';
export { assertSafeStorageKey } from './storage-key';
