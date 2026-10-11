// Moderate load for 1h+ to catch leaks, pool exhaustion and token-refresh issues.
import { signInAll } from './lib/session.js';
import { journey } from './lib/journey.js';
import { thresholds } from './lib/config.js';

const VUS = +(__ENV.VUS || 30);

export const options = {
  setupTimeout: '10m',
  stages: [
    { duration: '2m', target: VUS },
    { duration: __ENV.HOLD || '70m', target: VUS },
    { duration: '1m', target: 0 },
  ],
  thresholds: thresholds(),
};

export const setup = () => signInAll(VUS);
export default journey;
