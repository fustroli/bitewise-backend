# BiteWise Backend

NestJS API for BiteWise, backed by MySQL via TypeORM.

## Features

- Authentication (email/password + Google OAuth) with JWT access/refresh tokens
- Users, ingredients, meals, meal plans
- File storage via Google Cloud Storage
- Request throttling, validation, and security headers (helmet)
- Swagger API docs (disabled in production by default, see below)
- Liveness/readiness health checks

## Requirements

- Node.js 20
- MySQL

## Setup

```bash
bun install
cp .env.example .env   # then fill in the values
```

## Running

The schema is managed by migrations (see `docs/adr/0002-schema-managed-by-migrations.md`).
Apply them before the first start and after pulling new ones:

```bash
bun run migration:run
```

```bash
# development
bun run start

# watch mode
bun run start:dev

# production
bun run build
bun run start:prod
```

## Testing

```bash
bun run test        # unit tests
bun run test:e2e    # e2e tests
bun run test:cov    # coverage
```

## API docs

Swagger UI is served at `/api/docs` (OpenAPI JSON at `/api/docs-json`). It maps every route, so it is
**off in production by default** (`NODE_ENV=production`) and on everywhere else. Override with
`SWAGGER_ENABLED=true|false`, e.g. to debug a prod-like environment temporarily.

## Health checks

- `GET /api/health` - liveness. Confirms the process is up; no external dependency checks.
- `GET /api/health/ready` - readiness. Confirms the app can serve traffic, including a DB connectivity check (1.5s timeout).

Both return `200` with a `@nestjs/terminus` status payload when healthy, and `503` otherwise. Neither is rate-limited, so infra probes (load balancer, CodeDeploy, orchestrator) are never throttled.

## Deployment

Deployed via AWS CodeBuild (`buildspec.yml`) and CodeDeploy (`appspec.yml`) to an EC2 instance running the app under PM2. See `scripts/` for the install/start/stop/validate lifecycle hooks.
