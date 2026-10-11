// Expected traffic: ramp to 50 VUs, hold, ramp down (~15 min).
import { signInAll } from './lib/session.js';
import { journey } from './lib/journey.js';
import { thresholds } from './lib/config.js';

const VUS = +(__ENV.VUS || 50);

export const options = {
  setupTimeout: '10m',
  stages: [
    { duration: '2m', target: VUS },
    { duration: __ENV.HOLD || '12m', target: VUS },
    { duration: '1m', target: 0 },
  ],
  thresholds: thresholds(),
};

// One User (and Session) per VU
export const setup = () => signInAll(VUS);
export default journey;
