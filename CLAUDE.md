# BiteWise Backend — Claude Instructions

## Project Overview

NestJS REST API backend for BiteWise, a meal/ingredient tracking platform.

- **Framework**: NestJS 12 (ESM — `"type": "module"`, TypeScript, Node.js 20+)
- **ORM**: TypeORM 1.1 with MySQL (`mysql2`)
- **Auth**: per-device Sessions (`SessionService`); JWT access + refresh tokens carrying `sid`, issued as
  httpOnly cookies but accepted only as `Bearer`; Passport (email/password, Google OAuth, Facebook OAuth)
- **Storage**: Google Cloud Storage (`@google-cloud/storage`) — used for avatar uploads
- **API Docs**: Swagger (`@nestjs/swagger`) at `/api/docs`; all routes use global prefix `/api`
- **Health checks**: `@nestjs/terminus` (`GET /api/health` liveness, `GET /api/health/ready` readiness w/ DB check)
- **Testing**: Jest (ESM mode: `ts-jest` with `useESM`, run via `--experimental-vm-modules`)
- **Package manager**: npm
- **Linting/Formatting**: ESLint (flat config, `eslint.config.js`) + Prettier

---

## ESM — read this before touching imports

This is a pure ESM project (`package.json` has `"type": "module"`, `tsconfig.json` uses
`"module"/"moduleResolution": "nodenext"`). This has real consequences:

- **Every relative import needs an explicit `.js` extension**, even though the source is
  `.ts` (e.g. `import { User } from '../user/entities/index.js'`). TypeScript will not
  resolve `'../user/entities'` under `nodenext`.
- **No `__dirname`/`__filename`** — use `import.meta.dirname` instead.
- **Circular entity relations must use TypeORM's `Relation<T>` wrapper** on the property
  type (e.g. `user: Relation<User>`) to avoid a `ReferenceError: Cannot access 'X' before
  initialization` at runtime from `emitDecoratorMetadata` + circular imports. Every entity
  relation in this codebase is already wrapped this way — keep doing it for new relations.
- **A module that uses an `AuthGuard`-based guard itself must import `PassportModule.register({})`.**
  `@nestjs/passport` no longer implicitly provides `AuthModuleOptions`; without this import
  you'll get `UnknownDependenciesException` for the guard at boot. Today that is only
  `AuthModule`: `JwtGuard` is global, so feature modules import nothing for auth.
- Jest runs in ESM mode. The global `jest` object is restored via `jest.setup.ts`
  (`setupFiles` in the jest config) — don't remove it or `jest.fn()`/`jest.spyOn()` will be
  undefined in spec files.

---

## Project Structure

```
src/
  common/
    pagination/               # Shared pagination DTO + query-building helpers
    transformers/              # TypeORM column transformers (e.g. decimalTransformer)
  config/                      # Env-driven app config (src/config/index.ts)
  database/                    # dataSourceOptions (Nest + CLI), data-source.ts (CLI entry), migrations/
  modules/
    auth/                      # Session entity + SessionService (sign-up/in, refresh rotation, sign-out,
                               #   change-password), cookie helper, JWT/Google/Facebook strategies & guards
    user/                      # User entity (Profile groups embedded), ProfileService: /users/me + avatar
    ingredient/                # Ingredient CRUD, owned by a user
    meal/                      # Meal CRUD, composed of ingredients (MealIngredient join entity)
    meal-plan/                 # Meal plan CRUD, composed of meals (MealPlanMeal join entity)
    storage/                   # StorageService — GCS uploads (avatars)
    health/                    # Terminus health checks
  swagger/                     # Swagger setup (initializeSwagger)
  types/                       # Ambient type augmentations (Express.Request.user, multer types)
  utils/                       # Misc constants
app.module.ts                  # Root module
main.ts                        # Bootstrap (helmet, cookie-parser, CORS, validation pipe)
```

Each module follows: `controller/`, `service/`, `entities/`, `dto/` — with an `index.ts`
barrel per directory. Import from the barrel (`../entities/index.js`), not individual files.

---

## Entity relationships

- `User` → has many `Ingredient`, `Meal`, `MealPlan`; `PersonalInformation`, `SocialProfiles`,
  `BodyStats`, `NotificationSettings` are **embedded columns** on `user` (`@Column(() => X)`), not tables.
  Email unique among non-deleted Users (`activeEmail`, ADR-0001); `userName` unique (case-insensitive)
- `Meal` → has many `MealIngredient` (join entity linking `Meal` + `Ingredient`, with
  `quantity`); has many `MealPlanMeal`
- `MealPlan` → has many `MealPlanMeal` (join entity linking `MealPlan` + `Meal`)
- Soft deletes (`deleteTimeStamp` / `@DeleteDateColumn`) are used on `User`, `Ingredient`,
  `Meal`, `MealPlan`
- `relations` in `find`/`findOne`/`findAndCount` options use the **object form**
  (`{ user: true, mealIngredients: { ingredient: true } }`), not the old array-of-strings
  form — TypeORM 1.x requires this

---

## Key Conventions

- Auth: every route needs an access token by default (`JwtGuard` is `APP_GUARD` in `AuthModule`);
  opt out with `@Public()`, and add the route to `PUBLIC_ROUTES` in `test/routes-auth.e2e-spec.ts`.
  The caller is `IAuthenticatedUser { userId, sessionId }` via `@CurrentUser()` (no key argument).
  Throttling is global; tighten per route with `@Throttle`, never `@UseGuards(ThrottlerGuard)`

- Ownership: Owned resources (Ingredient, Meal, Meal plan) are accessed through
  `OwnedRepository<T>` (`src/common/ownership`), constructed in the service around the
  injected repo. The Owner always comes from the JWT (`@CurrentUser()`), never the request
  body; foreign and missing ids both 404. Referenced Owned resources (a Meal's Ingredients,
  a Meal plan's Meals) are resolved with `findManyOwned`, never a raw repo lookup.
- Composition: a Meal's Meal ingredients / a Meal plan's Meals are set by the service's private
  `compose` step (distinct members, `findManyOwned`, reuse kept join rows) inside one
  `manager.transaction`; dropped join rows are deleted via `orphanedRowAction: 'delete'`. Deleting
  an Ingredient used by a Meal, or a Meal in a Meal plan, is a 409
- Per-Owner name uniqueness: `@ActiveNameColumn()` + a unique `@Index(activeNameIndexName(label),
  ['user', 'activeName'])` on the entity (ADR-0001); the global `DuplicateEntryFilter` turns
  `ER_DUP_ENTRY` into a 409
- DTOs use `class-validator`/`class-transformer` decorators; `main.ts` has a global
  `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`
- Response shaping goes through `serializers/` (e.g. `meal.serializer.ts`,
  `meal-plan.serializer.ts`), not raw entity returns
- Pagination: `PaginationDto` in, `IPaginated<T>` out (`src/common/pagination`);
  `OwnedRepository.listOwned` enforces a per-resource `sortable` whitelist (unknown `orderBy`
  → 400), default limit 20, max 100. Controllers map pages with `mapPaginated`
- Env config is read through `src/config/index.ts` (`config.TYPEORM.*`, `config.PORT`, etc.),
  not `process.env` directly

---

## Common Commands

```bash
# Development
npm run start:dev              # Watch mode

# Build / prod
npm run build
npm run start:prod

# Migrations (all but create build first; the CLI runs against dist/)
npm run migration:generate -- src/database/migrations/<Name>   # diff entities vs DB
npm run migration:create -- src/database/migrations/<Name>     # empty (data changes)
npm run migration:run
npm run migration:revert       # local only
npm run migration:show

# Testing
npm run test                   # Unit tests (ESM, via --experimental-vm-modules)
npm run test:cov               # Coverage report
npm run test:e2e               # E2E tests
npm run test:int               # Integration tests (*.int-spec.ts) — needs Docker (Testcontainers MySQL)

# Lint / format
npm run lint
npm run format

# Docker (local MySQL, etc.)
npm run docker:dev
npm run docker:dev:down
```

---

## Migrations

The schema is owned by migrations only; `synchronize` is off everywhere (ADR-0002). Int tests
run the migrations too, and the Docker image runs `migration:run` before starting the app.

- Entity change → `migration:generate` against a dev DB that is fully migrated, then:
  - Add the class to the `migrations` array in `src/database/migrations/index.ts` (not globbed).
  - Review the SQL by hand and run `npx prettier --write` on the file.
  - If it writes `typeorm_metadata` rows (generated columns, ADR-0001), replace the hardcoded
    database name with `await queryRunner.getCurrentDatabase()` (see `InitialSchema`).
- `schema-drift.int-spec.ts` fails if the entities and the migrations disagree, or if `down()` doesn't
  revert cleanly.
- A migration is never edited once merged. Prod is forward-only; `down()` is for local use.
- Breaking changes (renames, new NOT NULL columns) use expand/contract: add new → backfill →
  deploy → drop old in a later migration. MySQL DDL auto-commits, so keep each migration small.

---

## Known pre-existing issue

A number of `*.spec.ts` files have stale mocks/signatures (missing providers in
`Test.createTestingModule`, service methods called with fewer args than they now take,
`jest.spyOn` on methods TypeScript can't see). These predate the September 2026 dependency
upgrade and are unrelated to it — don't assume a red test here means you broke something;
check whether the failure exists on `main` first.

---

## Deployment

Deployed via AWS CodeBuild (`buildspec.yml`, Node 22 runtime) and CodeDeploy (`appspec.yml`)
— see `scripts/` for the install/start/stop/validate lifecycle hooks and `README.md` for
more detail.

---

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`fustroli/bitewise-backend`) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` plus `docs/adr/` at the repo root. See `docs/agents/domain.md`.
