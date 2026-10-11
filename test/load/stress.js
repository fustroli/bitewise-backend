// Ramp to 500 VUs in steps to find where p95 or the error rate breaks.
// Thresholds are the load targets: crossing them marks the breaking point, it doesn't stop
// the run; only a >10% error rate aborts it.
import { signInAll } from './lib/session.js';
import { journey } from './lib/journey.js';
import { thresholds } from './lib/config.js';

const MAX_VUS = +(__ENV.VUS || 500);
const STEP = __ENV.STEP || '3m';
const steps = [0.1, 0.2, 0.4, 0.6, 0.8, 1].flatMap((f) => [
  { duration: '30s', target: Math.round(MAX_VUS * f) },
  { duration: STEP, target: Math.round(MAX_VUS * f) },
]);

export const options = {
  setupTimeout: '20m',
  stages: [...steps, { duration: '1m', target: 0 }],
  thresholds: {
    ...thresholds(),
    'http_req_failed{phase:run}': [
      'rate<0.01',
      { threshold: 'rate<0.1', abortOnFail: true, delayAbortEval: '1m' },
    ],
  },
};

export const setup = () => signInAll(MAX_VUS);
export default journey;
