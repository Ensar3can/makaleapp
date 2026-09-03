export interface ObjectPutResult {
  storageKey: string;
  size: number;
  checksum: string;
}

export interface IObjectStorage {
  put(key: string, body: Buffer, contentType: string): Promise<ObjectPutResult>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
