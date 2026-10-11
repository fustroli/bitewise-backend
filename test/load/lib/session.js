import http from 'k6/http';
import { fail } from 'k6';
import { BASE_URL, PASSWORD, USER_PREFIX } from './config.js';
import { call, clientIp, tokensOf } from './api.js';

export const emailOf = (n) => `${USER_PREFIX}-${n}@loadtest.bitewise.dev`;

export function signIn(n, phase) {
  return call('POST', '/auth/signin', {
    n,
    body: { email: emailOf(n), password: PASSWORD },
    tags: { name: 'POST /auth/signin', phase, kind: 'auth' },
  });
}

export function signUp(n) {
  return call('POST', '/auth/signup', {
    n,
    body: { email: emailOf(n), password: PASSWORD, confirmPassword: PASSWORD },
    tags: { name: 'POST /auth/signup', phase: 'provision', kind: 'auth' },
  });
}

// Rotates the Session's refresh token; returns the new pair
export function refresh(n, refreshToken) {
  const res = call('POST', '/auth/refresh', {
    n,
    token: refreshToken,
    tags: { name: 'POST /auth/refresh', phase: 'run', kind: 'auth' },
  });
  return res.status === 200 ? tokensOf(res) : null;
}

const CHUNK = 25;

const list = (path, n, token) => ({
  method: 'GET',
  url: `${BASE_URL}${path}?limit=100`,
  params: {
    headers: {
      'X-Forwarded-For': clientIp(n),
      Authorization: `Bearer ${token}`,
    },
    tags: { name: `GET ${path} (setup)`, phase: 'setup' },
  },
});

const ids = (res) => res.json('data').map((r) => r.id);

/**
 * setup() for every scenario: signs Users 1..users in (one Session each) and collects
 * their resource ids. The Users must already exist (provision.js).
 */
export function signInAll(users) {
  const result = [];
  for (let start = 1; start <= users; start += CHUNK) {
    const ns = [];
    for (let n = start; n < Math.min(start + CHUNK, users + 1); n++) ns.push(n);

    const signIns = http.batch(
      ns.map((n) => ({
        method: 'POST',
        url: `${BASE_URL}/auth/signin`,
        body: JSON.stringify({ email: emailOf(n), password: PASSWORD }),
        params: {
          headers: {
            'X-Forwarded-For': clientIp(n),
            'Content-Type': 'application/json',
          },
          tags: { name: 'POST /auth/signin', phase: 'setup' },
        },
      })),
    );
    const sessions = signIns.map((res, i) => {
      if (res.status !== 200)
        fail(
          `sign-in of ${emailOf(ns[i])} got ${res.status}; run provision.js with USERS>=${users}`,
        );
      return { n: ns[i], ...tokensOf(res) };
    });

    const lists = http.batch(
      sessions.flatMap(({ n, accessToken }) => [
        list('/ingredient', n, accessToken),
        list('/meal', n, accessToken),
        list('/meal-plan', n, accessToken),
      ]),
    );
    sessions.forEach((s, i) => {
      const [ingredients, meals, mealPlans] = lists.slice(i * 3, i * 3 + 3);
      if (!ids(meals).length || !ids(mealPlans).length)
        fail(`${emailOf(s.n)} has no Meals / Meal plans; run provision.js`);
      result.push({
        ...s,
        ingredientIds: ids(ingredients),
        mealIds: ids(meals),
        mealPlanIds: ids(mealPlans),
      });
    });
  }
  return { users: result };
}
