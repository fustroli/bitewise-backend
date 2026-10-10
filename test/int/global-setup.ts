import { MySqlContainer } from '@testcontainers/mysql';

// One MySQL container per test run; each test file creates its own database
// in it (see test-database.ts). Connection details reach the workers via env.
export default async function globalSetup() {
  const container = await new MySqlContainer('mysql:8.4').start();

  process.env.INT_DB_HOST = container.getHost();
  process.env.INT_DB_PORT = String(container.getPort());
  process.env.INT_DB_ROOT_PASSWORD = container.getRootPassword();

  (globalThis as { mysqlContainer?: unknown }).mysqlContainer = container;
}
