import { Module } from '@nestjs/common';
import { FileStore } from './file-store.js';
import { S3FileStore } from './s3-file-store.js';

@Module({
  providers: [{ provide: FileStore, useClass: S3FileStore }],
  exports: [FileStore],
})
export class StorageModule {}
