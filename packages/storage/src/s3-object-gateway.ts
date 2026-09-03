export interface S3ObjectGateway {
  putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  getObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
}

export interface InMemoryS3Object {
  body: Buffer;
  contentType: string;
}

export class InMemoryS3ObjectGateway implements S3ObjectGateway {
  public constructor(private readonly objects = new Map<string, InMemoryS3Object>()) {}

  public async putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void> {
    this.objects.set(input.key, { body: Buffer.from(input.body), contentType: input.contentType });
  }

  public async getObject(key: string): Promise<Buffer> {
    const object = this.objects.get(key);

    if (!object) {
      throw new Error(`Object not found: ${key}`);
    }

    return Buffer.from(object.body);
  }

  public async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  public async objectExists(key: string): Promise<boolean> {
    return this.objects.has(key);
  }
}
