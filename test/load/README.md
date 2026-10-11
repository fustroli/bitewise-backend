# Load tests (k6)

Backend-only load tests: a prod build against an isolated, migrated MySQL that `provision.js`
seeds through the API. No frontend, OAuth or avatar traffic (GCS is never called).

| Script         | Shape                                             | Users (`-e`) |
| -------------- | ------------------------------------------------- | ------------ |
| `provision.js` | Creates the Users + their data; re-runnable       | `USERS=500`  |
| `smoke.js`     | 2 VUs, 1 min — checks scripts + env               | `USERS=2`    |
| `load.js`      | ramp 2m → 50 VUs for 12m → down 1m                | `VUS=50`     |
| `stress.js`    | 50 → 100 → 200 → 300 → 400 → 500 VUs, 3m per step | `VUS=500`    |
| `soak.js`      | 30 VUs for 70m                                    | `VUS=30`     |

Durations: `HOLD` (load/soak), `STEP` (stress), `DURATION` (smoke). Target: `BASE_URL`
(default `http://localhost:8000/api`).

## How it models traffic

- **One User + Session per VU.** `setup()` signs in Users `1..VUS` (they must exist: run
  `provision.js` with `USERS` ≥ the biggest run). VUs never share a Session, so refresh-token
  rotation stays valid; each VU refreshes ~30s before its access token expires.
- **One client IP per User** via `X-Forwarded-For` (`10.x.y.z`), so the per-IP throttler
  sees N clients, as in prod. The app must trust it: `TRUST_PROXY_HOPS=1` when k6 hits Node
  directly, `2` when it hits nginx (nginx appends k6's address, like CloudFront in prod).
- **Per User data** (`provision.js`): 40 Ingredients, 20 Meals × 5 Ingredients, 8 Meal plans
  × 5 Meals.
- **Action mix** (1–3s think time between actions): list Meals 25%, get Meal 15%, list Meal
  plans 20%, get Meal plan 10%, list Ingredients 8%, statistics 5%, `/users/me` 5%, update
  Meal (compose transaction) 8%, create + delete Meal 4%. ~20% of lists use `search`.
- **Thresholds** apply to `phase:run` only (`setup()`'s bcrypt sign-ins are excluded):
  errors < 1%, p95 < 300ms, p99 < 1s, checks > 99%. The summary also splits `kind:read` /
  `kind:write`. Stress aborts once errors pass 10%.

## Running

Needs [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) on the load generator
(or `docker run --rm -i -v "$PWD/test/load:/scripts" grafana/k6 run /scripts/smoke.js`).

**1. Isolated database** (never dev or prod):

```bash
docker run -d --name bitewise-loadtest-db -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=loadtest -e MYSQL_DATABASE=bitewise_loadtest mysql:8.4
```

**2. App env**: `cp test/load/loadtest.env.example test/load/loadtest.env` (gitignored) and
adjust. Values in it win over `.env`. Keep it prod-like (`NODE_ENV=production`,
`SALT_WORK_FACTOR` as prod); `THROTTLER_LIMIT` just needs to sit above one user's rate
(~30 req/min).

**3. Prod build, migrated, started:**

```bash
npm run build
node --env-file=test/load/loadtest.env node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js
node --env-file=test/load/loadtest.env dist/main.js
```

**4. From the load generator** (a separate machine for real numbers; it eats CPU too):

```bash
k6 run -e BASE_URL=http://<app-host>:8000/api -e USERS=500 test/load/provision.js
k6 run -e BASE_URL=http://<app-host>:8000/api test/load/smoke.js   # then load / stress / soak
```

`provision.js` reports one failed request per new User: the sign-in that 401s before the
sign-up. `npm run load:<script>` wraps `k6 run` (pass `-- -e BASE_URL=...`).

Keep the results (gitignored): `k6 run --summary-export=test/load/results/<scenario>-<date>.json ...`.

## What to watch during a run

- **k6**: p95/p99 per `name`, RPS, `http_req_failed` (429 = throttler; 5xx = app/DB).
- **Node**: CPU, RSS over time (soak: should plateau), event-loop lag
  (`clinic doctor -- node dist/main.js`, or `--inspect` for hot paths).
- **MySQL**: `SET GLOBAL slow_query_log=1, long_query_time=0.1;`, `SHOW PROCESSLIST`,
  `Threads_connected`. The TypeORM/mysql2 pool is the default 10 connections — waiting on
  it shows up as latency with idle CPU.

## Baseline

Fill in from the run (#75). Environment: <!-- instance type, MySQL version, commit -->

| Scenario | VUs | RPS | p95 | p99 | Errors | Notes           |
| -------- | --- | --- | --- | --- | ------ | --------------- |
| Smoke    |     |     |     |     |        |                 |
| Load     |     |     |     |     |        |                 |
| Stress   |     |     |     |     |        | breaking point: |
| Soak     |     |     |     |     |        | memory trend:   |

First bottleneck: <!-- e.g. CPU (bcrypt), DB pool, a slow query -->

### Local reference (2026-10-11, commit `5be3c34`)

Not a capacity number: compare it only with runs on the same setup. Laptop (i5-1235U); app
pinned to one P-core's 2 threads (`taskset -c 0,1`, ~t3.micro's 2 vCPUs, but faster and
without CPU credits); MySQL 8.0 in Docker Desktop with the stack's low-mem settings (128M
buffer pool, `max_connections=30`), not pinned; native k6 on the other cores; no nginx.
500 Users provisioned.

| Scenario           | VUs    | RPS      | p95   | p99   | Errors | Notes                              |
| ------------------ | ------ | -------- | ----- | ----- | ------ | ---------------------------------- |
| Smoke              | 2      | 1        | 40ms  | 49ms  | 0%     |                                    |
| Load               | 50     | 23       | 31ms  | 59ms  | 0%     | node CPU avg 17%                   |
| Stress             | 50→500 | ~200 max | 1.01s | 1.22s | 0%     | saturates at ~300 VUs / ~150 RPS   |
| Soak (20m, not 70) | 30     | 15       | 29ms  | 38ms  | 0%     | RSS flat (node 461MB, MySQL 216MB) |

First bottleneck: **the Node main thread** (node pegged at ~105% = one core; MySQL ≤ 60%
CPU, pool never past its 10 connections, no errors). A CPU profile at 250 VUs puts ~40% of
main-thread time in TypeORM (query building, alias mapping, hydration), mysql2 7%, GC 6%,
class-transformer 4%; Express/Nest/pino/compression/throttler ~1% each. Contributing:

- Every authenticated request costs 2 queries before the handler: `SessionService.findActive`
  (`findOne` + `relations` → TypeORM's DISTINCT-ids query + the real one).
- `GET /meal-plan` (list or one) = 10 queries with `relationLoadStrategy: 'query'`, plus the
  2 auth ones; `PATCH /meal` = 15 (two reloads, one `INSERT` per Meal ingredient).
- Sign-in (bcrypt cost 12) ~700ms avg while 250 sign in at once.
