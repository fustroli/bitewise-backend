import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { config } from './config/index.js';

const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: config.TYPEORM.HOST,
  port: config.TYPEORM.PORT,
  username: config.TYPEORM.USERNAME,
  password: config.TYPEORM.PASSWORD,
  database: config.TYPEORM.DATABASE_DEV,
  entities: [join(import.meta.dirname, '**/**.entity{.ts,.js}')],
  logging: false,
  synchronize: true,
};

export default databaseConfig;
