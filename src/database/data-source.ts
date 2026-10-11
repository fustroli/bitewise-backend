import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source.options.js';

// Entry point for the TypeORM CLI only (npm run migration:*), run from dist.
export default new DataSource(dataSourceOptions);
