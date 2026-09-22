import * as crypto from 'crypto';

import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { config } from '../../config/index.js';

@Injectable()
export class StorageService {
  private readonly storage: Storage;
  private readonly bucket: string;

  constructor() {
    this.storage = new Storage({
      keyFilename: config.GCP.GCP_PRIVATE_KEY_FILE,
      projectId: config.GCP.GCP_PROJECT_ID,
    });
    this.bucket = config.GCP.GCP_BUCKET_NAME;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileId = crypto.randomUUID();
    const filename = `public_avatars/${fileId}-${file.originalname}`;

    const bucket = this.storage.bucket(this.bucket);

    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${config.GCP.GCP_BUCKET_NAME}/${blob.name}`;
        resolve(publicUrl);
      });
      blobStream.end(file.buffer);
    });
  }
}
