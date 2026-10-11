// Creates load-test Users 1..USERS with their Ingredients, Meals and Meal plans, through
// the API. Re-runnable: existing Users sign in, and only missing resources are created.
//
//   k6 run -e USERS=500 test/load/provision.js
import { fail } from 'k6';
import exec from 'k6/execution';
import { call, tokensOf } from './lib/api.js';
import { emailOf, signIn, signUp } from './lib/session.js';
import { DATA } from './lib/config.js';

const USERS = +(__ENV.USERS || 500);

export const options = {
  scenarios: {
    provision: {
      executor: 'shared-iterations',
      vus: Math.min(USERS, +(__ENV.PROVISION_VUS || 10)),
      iterations: USERS,
      maxDuration: '2h',
    },
  },
  summaryTrendStats: ['avg', 'p(95)', 'max'],
};

const tags = (name) => ({ name, phase: 'provision' });

// Deterministic per-User sample so re-runs and Users differ but stay stable
function pickFrom(ids, k, seed) {
  const picked = [];
  for (let i = 0; picked.length < Math.min(k, ids.length); i++) {
    const id = ids[(seed * 7 + i * 13) % ids.length];
    if (!picked.includes(id)) picked.push(id);
  }
  return picked;
}

function listAll(path, n, token) {
  const res = call('GET', `${path}?limit=100`, {
    n,
    token,
    tags: tags(`GET ${path}`),
  });
  if (res.status !== 200) fail(`list ${path} for ${emailOf(n)}: ${res.status}`);
  return res.json('data');
}

// Creates the missing `${label} 1..count`; a 409 (name taken) is fine
function ensure(path, label, count, n, token, bodyFor) {
  const have = new Set(listAll(path, n, token).map((r) => r.name));
  for (let i = 1; i <= count; i++) {
    const name = `${label} ${i}`;
    if (have.has(name)) continue;
    const res = call('POST', path, {
      n,
      token,
      body: { name, ...bodyFor(i) },
      tags: tags(`POST ${path}`),
    });
    if (res.status !== 201 && res.status !== 409)
      fail(`create ${name} for ${emailOf(n)}: ${res.status} ${res.body}`);
  }
  return listAll(path, n, token).map((r) => r.id);
}

export default function () {
  const n = exec.scenario.iterationInTest + 1;

  let res = signIn(n, 'provision');
  if (res.status === 401) res = signUp(n);
  if (res.status !== 200 && res.status !== 201)
    fail(`auth ${emailOf(n)}: ${res.status} ${res.body}`);
  const { accessToken: token } = tokensOf(res);

  const ingredientIds = ensure(
    '/ingredient',
    'Ingredient',
    DATA.ingredients,
    n,
    token,
    (i) => {
      const fat = 1 + (i % 20);
      return {
        protein: (i * 3) % 40,
        totalFat: fat,
        saturatedFat: fat / 2,
        totalCarbohydrates: (i * 7) % 80,
        sugar: (i * 2) % 30,
        dietaryFiber: i % 10,
        calories: 50 + ((i * 37) % 400),
        unit: i % 4 ? '100g' : 'piece',
      };
    },
  );

  const mealIds = ensure('/meal', 'Meal', DATA.meals, n, token, (i) => ({
    mealIngredients: pickFrom(
      ingredientIds,
      DATA.ingredientsPerMeal,
      n + i,
    ).map((ingredientId, j) => ({
      ingredientId,
      quantity: 50 + j * 25,
    })),
  }));

  ensure('/meal-plan', 'Meal plan', DATA.mealPlans, n, token, (i) => ({
    mealIds: pickFrom(mealIds, DATA.mealsPerPlan, n + i),
  }));
}
