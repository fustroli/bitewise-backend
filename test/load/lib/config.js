// Shared settings for the k6 scripts; every value can be overridden with -e KEY=value.

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/api';

// Load-test Users are <USER_PREFIX>-<n>@loadtest.bitewise.dev, n = 1..USERS
export const USER_PREFIX = __ENV.USER_PREFIX || 'loadtest';
export const PASSWORD = __ENV.LOADTEST_PASSWORD || 'LoadTest#2026';

// Owned resources provisioned per User (provision.js)
export const DATA = {
  ingredients: +(__ENV.INGREDIENTS_PER_USER || 40),
  meals: +(__ENV.MEALS_PER_USER || 20),
  mealPlans: +(__ENV.MEAL_PLANS_PER_USER || 8),
  ingredientsPerMeal: 5,
  mealsPerPlan: 5,
};

// Seconds a virtual user waits between actions
export const THINK_TIME = { min: 1, max: 3 };

// Only main-phase traffic counts: setup()'s bcrypt-heavy sign-ins are tagged phase:setup
export const thresholds = (p95 = 300, p99 = 1000) => ({
  'http_req_failed{phase:run}': ['rate<0.01'],
  'http_req_duration{phase:run}': [`p(95)<${p95}`, `p(99)<${p99}`],
  // Per-group submetrics so the summary breaks latency down
  'http_req_duration{phase:run,kind:read}': [`p(95)<${p95}`],
  'http_req_duration{phase:run,kind:write}': [`p(95)<${p95}`],
  checks: ['rate>0.99'],
});
