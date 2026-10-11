import { check, sleep } from 'k6';
import exec from 'k6/execution';
import encoding from 'k6/encoding';
import { call } from './api.js';
import { refresh } from './session.js';
import { DATA, THINK_TIME } from './config.js';

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const sample = (xs, k) => [...xs].sort(() => Math.random() - 0.5).slice(0, k);
const searches = ['a', 'e', 'Meal 1', 'Ingredient 2', 'xyz'];

// This VU's Session; tokens rotate on refresh, so they live here, not in setup data
let me;

// Seconds since epoch when the access token expires (JWT `exp`)
const expiryOf = (jwt) =>
  JSON.parse(encoding.b64decode(jwt.split('.')[1], 'rawurl', 's')).exp;

// Like the frontend: refresh shortly before the access token expires, so no request 401s
function ensureFresh() {
  if (expiryOf(me.accessToken) - Date.now() / 1000 > 30) return;
  const tokens = refresh(me.n, me.refreshToken);
  if (tokens) Object.assign(me, tokens);
}

function request(method, path, name, kind, body) {
  ensureFresh();
  return call(method, path, {
    n: me.n,
    token: me.accessToken,
    body,
    tags: { name, phase: 'run', kind },
  });
}

const ok = (res, status = 200) =>
  check(res, {
    [`${res.request.method} ${status}`]: (r) => r.status === status,
  });

const listQuery = () =>
  `?limit=20&offset=${pick([0, 0, 0, 20])}` +
  (Math.random() < 0.2 ? `&search=${encodeURIComponent(pick(searches))}` : '');

const mealIngredients = () =>
  sample(me.ingredientIds, DATA.ingredientsPerMeal).map((ingredientId) => ({
    ingredientId,
    quantity: Math.round(Math.random() * 300) + 10,
  }));

// Weighted mix: reads dominate; writes go through the compose transaction
const actions = [
  [25, () => ok(request('GET', `/meal${listQuery()}`, 'GET /meal', 'read'))],
  [
    15,
    () =>
      ok(request('GET', `/meal/${pick(me.mealIds)}`, 'GET /meal/:id', 'read')),
  ],
  [
    20,
    () =>
      ok(request('GET', `/meal-plan${listQuery()}`, 'GET /meal-plan', 'read')),
  ],
  [
    10,
    () =>
      ok(
        request(
          'GET',
          `/meal-plan/${pick(me.mealPlanIds)}`,
          'GET /meal-plan/:id',
          'read',
        ),
      ),
  ],
  [
    8,
    () =>
      ok(
        request('GET', `/ingredient${listQuery()}`, 'GET /ingredient', 'read'),
      ),
  ],
  [
    5,
    () =>
      ok(
        request(
          'GET',
          '/users/me/statistics',
          'GET /users/me/statistics',
          'read',
        ),
      ),
  ],
  [5, () => ok(request('GET', '/users/me', 'GET /users/me', 'read'))],
  [
    8,
    () =>
      ok(
        request(
          'PATCH',
          `/meal/${pick(me.mealIds)}`,
          'PATCH /meal/:id',
          'write',
          {
            mealIngredients: mealIngredients(),
          },
        ),
      ),
  ],
  [
    4,
    // Create + delete keeps each User's data set the same size across runs
    () => {
      const res = request('POST', '/meal', 'POST /meal', 'write', {
        name: `Temp ${exec.vu.idInTest}-${exec.vu.iterationInScenario}-${Date.now()}`,
        mealIngredients: mealIngredients(),
      });
      if (ok(res, 201))
        ok(
          request(
            'DELETE',
            `/meal/${res.json('id')}`,
            'DELETE /meal/:id',
            'write',
          ),
          204,
        );
    },
  ],
];
const totalWeight = actions.reduce((sum, [w]) => sum + w, 0);

/** One user action + think time. VU k drives User ((k - 1) mod users) + 1. */
export function journey(data) {
  if (!me) {
    const { users } = data;
    me = { ...users[(exec.vu.idInTest - 1) % users.length] };
  }
  let r = Math.random() * totalWeight;
  for (const [weight, action] of actions) {
    if ((r -= weight) < 0) {
      action();
      break;
    }
  }
  sleep(THINK_TIME.min + Math.random() * (THINK_TIME.max - THINK_TIME.min));
}
