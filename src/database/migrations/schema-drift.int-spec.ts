import {
  connectTestDatabase,
  createTestDatabase,
} from '../../../test/int/test-database.js';

// Migrations alone must produce exactly the schema the entities describe.
// Fails when an entity changed without a migration, a migration is missing
// from the barrel, or TypeORM re-diffs ADR-0001's generated columns.
describe('migrations', () => {
  it('leave no schema drift against the entities', async () => {
    const dataSource = await connectTestDatabase(await createTestDatabase());
    const pending = await dataSource.driver.createSchemaBuilder().log();
    await dataSource.destroy();

    expect(pending.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('revert cleanly back to an empty schema', async () => {
    const dataSource = await connectTestDatabase(await createTestDatabase());
    for (let i = 0; i < dataSource.migrations.length; i++) {
      await dataSource.undoLastMigration();
    }
    const tables: unknown[] = await dataSource.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME NOT IN ('migrations', 'typeorm_metadata')`,
    );
    await dataSource.destroy();

    expect(tables).toEqual([]);
  });
});
