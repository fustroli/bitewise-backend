import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { config } from '../config/index.js';
import { migrations } from './migrations/index.js';

// Shared by Nest (AppModule) and the TypeORM CLI (data-source.ts).
// The schema is owned by migrations only (ADR-0002), never synchronize.
export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: config.TYPEORM.HOST,
  port: config.TYPEORM.PORT,
  username: config.TYPEORM.USERNAME,
  password: config.TYPEORM.PASSWORD,
  database: config.TYPEORM.DATABASE_DEV,
  entities: [join(import.meta.dirname, '..', '**/*.entity.{ts,js}')],
  migrations,
  migrationsTransactionMode: 'each',
  logging: false,
  synchronize: false,
};
