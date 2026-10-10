import {
  connectTestDatabase,
  createTestDatabase,
} from '../../../test/int/test-database.js';

// TypeORM has a history of re-diffing generated columns on every synchronize.
// If this starts failing, fall back to an app-level name check (see ADR-0001).
describe('activeName generated column', () => {
  it('causes no schema drift on a second synchronize', async () => {
    const database = await createTestDatabase();
    await (await connectTestDatabase(database)).destroy();

    const second = await connectTestDatabase(database);
    const pending = await second.driver.createSchemaBuilder().log();
    await second.destroy();

    expect(pending.upQueries.map((q) => q.query)).toEqual([]);
  });
});
