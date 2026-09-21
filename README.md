# BiteWise Backend

NestJS API for BiteWise, backed by MySQL via TypeORM.

## Features

- Authentication (email/password + Google/Facebook OAuth) with JWT access/refresh tokens
- Users, ingredients, meals, meal plans
- File storage via Google Cloud Storage
- Request throttling, validation, and security headers (helmet)
- Swagger API docs
- Liveness/readiness health checks

## Requirements

- Node.js 20
- MySQL

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values
```

## Running

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run build
npm run start:prod
```

## Testing

```bash
npm run test        # unit tests
npm run test:e2e    # e2e tests
npm run test:cov    # coverage
```

## Health checks

- `GET /health` - liveness. Confirms the process is up; no external dependency checks.
- `GET /health/ready` - readiness. Confirms the app can serve traffic, including a DB connectivity check (1.5s timeout).

Both return `200` with a `@nestjs/terminus` status payload when healthy, and `503` otherwise. Neither is rate-limited, so infra probes (load balancer, CodeDeploy, orchestrator) are never throttled.

## Deployment

Deployed via AWS CodeBuild (`buildspec.yml`) and CodeDeploy (`appspec.yml`) to an EC2 instance running the app under PM2. See `scripts/` for the install/start/stop/validate lifecycle hooks.
