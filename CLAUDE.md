# BiteWise Backend — Claude Instructions

## Project Overview

NestJS REST API backend for BiteWise, a meal/ingredient tracking platform.

- **Framework**: NestJS 12 (ESM — `"type": "module"`, TypeScript, Node.js 20+)
- **ORM**: TypeORM 1.1 with MySQL (`mysql2`)
- **Auth**: JWT (access + refresh, cookie-based) + Passport (email/password, Google OAuth, Facebook OAuth)
- **Storage**: Google Cloud Storage (`@google-cloud/storage`) — used for avatar uploads
- **API Docs**: Swagger (`@nestjs/swagger`)
- **Health checks**: `@nestjs/terminus` (`GET /health` liveness, `GET /health/ready` readiness w/ DB check)
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
- **Every module that uses an `AuthGuard`-based guard must import `PassportModule.register({})`.**
  `@nestjs/passport` no longer implicitly provides `AuthModuleOptions`; without this import
  you'll get `UnknownDependenciesException` for the guard at boot.
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
  modules/
    auth/                      # Signup/signin, JWT strategy, Google/Facebook OAuth strategies & guards
    token/                     # Access/refresh token issuance, cookie handling
    user/                      # User entity + nested personal-info/social-profiles/notifications entities
    ingredient/                # Ingredient CRUD, owned by a user
    meal/                      # Meal CRUD, composed of ingredients (MealIngredient join entity)
    meal-plan/                 # Meal plan CRUD, composed of meals (MealPlanMeal join entity)
    storage/                   # StorageService — GCS uploads (avatars)
    health/                    # Terminus health checks
  swagger/                     # Swagger setup (initializeSwagger)
  types/                       # Ambient type augmentations (Express.Request.user, multer types)
  utils/                       # Misc constants
app.module.ts                  # Root module
app.development.config.ts      # TypeORM datasource config (dev)
main.ts                        # Bootstrap (helmet, cookie-parser, CORS, validation pipe)
```

Each module follows: `controller/`, `service/`, `entities/`, `dto/` — with an `index.ts`
barrel per directory. Import from the barrel (`../entities/index.js`), not individual files.

---

## Entity relationships

- `User` → has many `Ingredient`, `Meal`, `MealPlan`; has one each of `PersonalInformation`,
  `SocialProfiles`, `NotificationSettings` (eager-loaded, cascade: false)
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

- Ownership checks: services verify `entity.user.id === userId` before mutating/deleting
  (see `checkMealOwner` in `meal.service.ts` for the pattern)
- DTOs use `class-validator`/`class-transformer` decorators; `main.ts` has a global
  `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`
- Response shaping goes through `serializers/` (e.g. `meal.serializer.ts`,
  `meal-plan.serializer.ts`), not raw entity returns
- Pagination: use `PaginationDto` + `createQueryObject()` from `src/common/pagination`
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

# Testing
npm run test                   # Unit tests (ESM, via --experimental-vm-modules)
npm run test:cov               # Coverage report
npm run test:e2e               # E2E tests

# Lint / format
npm run lint
npm run format

# Docker (local MySQL, etc.)
npm run docker:dev
npm run docker:dev:down
```

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
