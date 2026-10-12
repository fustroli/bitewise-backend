import { FileStore, IPutOptions } from './file-store.js';

export interface IStoredFile extends IPutOptions {
  body: Buffer;
}

/** Test adapter. Set `failPut` / `failDelete` to simulate provider outages. */
export class InMemoryFileStore extends FileStore {
  readonly files = new Map<string, IStoredFile>();
  failPut = false;
  failDelete = false;

  async put(key: string, body: Buffer, options: IPutOptions): Promise<void> {
    if (this.failPut) throw new Error('put failed');
    this.files.set(key, { body, ...options });
  }

  async delete(key: string): Promise<void> {
    if (this.failDelete) throw new Error('delete failed');
    this.files.delete(key);
  }
}
