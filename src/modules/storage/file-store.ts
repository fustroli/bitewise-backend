export interface IPutOptions {
  contentType: string;
  cacheControl?: string;
}

/** Port for blob storage; adapters are S3 in production, in-memory in tests. */
export abstract class FileStore {
  abstract put(key: string, body: Buffer, options: IPutOptions): Promise<void>;
  abstract delete(key: string): Promise<void>;
}
