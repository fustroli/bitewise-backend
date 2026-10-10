import { StartedMySqlContainer } from '@testcontainers/mysql';

export default async function globalTeardown() {
  const { mysqlContainer } = globalThis as {
    mysqlContainer?: StartedMySqlContainer;
  };
  await mysqlContainer?.stop();
}
