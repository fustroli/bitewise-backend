---
status: accepted
---

# Schema managed by migrations, run as a pre-start step

With production hosting coming, the schema can no longer be managed by TypeORM `synchronize`, which applies whatever diff it computes at boot (including column drops) with no review or history. The schema is now owned by versioned TypeORM migrations in every environment, local dev and integration tests included, so prod is never the first place a migration runs. Migrations run as an explicit step before the app starts (`migration:run && node dist/main.js`), not at app boot. The TypeORM CLI runs against the compiled `dist` DataSource, and migrations are listed explicitly in a barrel rather than globbed.

## Considered Options

- **`synchronize` in dev, migrations in prod**: dev and prod build the schema differently, so a missing or wrong migration surfaces first in prod.
- **`migrationsRun: true` at app boot**: simplest, but multiple instances starting together race on the same migrations, and a failing migration crash-loops the app instead of failing the deploy.
- **CLI via `typeorm-ts-node-esm`**: no build step, but ts-node is unreliable with ESM + `nodenext`. Building first is slower but uses the same code that runs in prod.
- **Globbed migrations**: no barrel to maintain, but Jest's ESM transform can't load glob-loaded files, and the integration tests must run the migrations. The schema-drift integration test catches a migration missing from the barrel.

## Consequences

- Every entity change needs a migration (`bun run migration:generate`). The schema-drift integration test fails without one.
- Generated SQL that writes `typeorm_metadata` rows (generated columns, ADR-0001) hardcodes the generating database's name. Replace it with `await queryRunner.getCurrentDatabase()`.
- MySQL DDL auto-commits, so a failed migration can leave part of its changes applied. Keep migrations small, and make breaking changes in expand/contract steps.

See fustroli/bitewise-backend#46.
