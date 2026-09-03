import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { S3ObjectGateway } from './s3-object-gateway';

export interface AwsS3ObjectGatewayOptions {
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  endpoint?: string;
  forcePathStyle: boolean;
}

export class AwsS3ObjectGateway implements S3ObjectGateway {
  private readonly client: S3Client;

  public constructor(private readonly options: AwsS3ObjectGatewayOptions) {
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint && options.endpoint.length > 0 ? options.endpoint : undefined,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKey,
        secretAccessKey: options.secretKey,
      },
    });
  }

  public async putObject(input: { key: string; body: Buffer; contentType: string }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );
  }

  public async getObject(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Object not found: ${key}`);
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  public async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
      }),
    );
  }

  public async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error: unknown) {
      if (error instanceof NotFound || (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound')) {
        return false;
      }

      if (error && typeof error === 'object' && '$metadata' in error) {
        const metadata = error.$metadata as { httpStatusCode?: number };
        if (metadata.httpStatusCode === 404) {
          return false;
        }
      }

      throw error;
    }
  }
}
