import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { config } from '../../config/index.js';
import { FileStore, IPutOptions } from './file-store.js';

/** Credentials come from the AWS SDK default provider chain. */
@Injectable()
export class S3FileStore extends FileStore {
  private readonly client = new S3Client({ region: config.S3.REGION });

  async put(key: string, body: Buffer, options: IPutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.S3.BUCKET,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        CacheControl: options.cacheControl,
      }),
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: config.S3.BUCKET, Key: key }),
    );
  }
}
