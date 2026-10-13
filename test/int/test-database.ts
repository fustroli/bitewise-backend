import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { migrations } from '../../src/database/migrations/index.js';
import {
  EmailVerificationToken,
  Session,
} from '../../src/modules/auth/entities/index.js';
import { Ingredient } from '../../src/modules/ingredient/entities/index.js';
import { Meal, MealIngredient } from '../../src/modules/meal/entities/index.js';
import {
  MealPlan,
  MealPlanMeal,
} from '../../src/modules/meal-plan/entities/index.js';
import { User } from '../../src/modules/user/entities/index.js';

// Listed explicitly: TypeORM's glob loading bypasses Jest's ESM transform.
const entities = [
  User,
  Ingredient,
  Meal,
  MealIngredient,
  MealPlan,
  MealPlanMeal,
  Session,
  EmailVerificationToken,
];

function options(database?: string): DataSourceOptions {
  return {
    type: 'mysql',
    host: process.env.INT_DB_HOST,
    port: Number(process.env.INT_DB_PORT),
    username: 'root',
    password: process.env.INT_DB_ROOT_PASSWORD,
    database,
    entities,
    migrations,
    migrationsTransactionMode: 'each',
    logging: false,
  };
}

/** Creates a fresh, empty database for the calling test file. */
export async function createTestDatabase(): Promise<string> {
  const name = `int_${randomUUID().replace(/-/g, '')}`;
  const admin = await new DataSource({
    ...options(),
    entities: [],
  }).initialize();
  await admin.query(`CREATE DATABASE \`${name}\``);
  await admin.destroy();
  return name;
}

/** Connects to `database`, running pending migrations (as in production). */
export function connectTestDatabase(database: string): Promise<DataSource> {
  return new DataSource({
    ...options(database),
    migrationsRun: true,
  }).initialize();
}

export async function createUser(dataSource: DataSource): Promise<User> {
  return dataSource
    .getRepository(User)
    .save({ email: `${randomUUID()}@example.com` });
}
