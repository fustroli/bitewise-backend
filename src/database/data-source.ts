import { DataSource } from 'typeorm';
import { assertValidEnv } from '../config/index.js';
import { dataSourceOptions } from './data-source.options.js';

// Entry point for the TypeORM CLI only (npm run migration:*), run from dist.
// Migrations must not run against a bad config either.
assertValidEnv();

export default new DataSource(dataSourceOptions);
