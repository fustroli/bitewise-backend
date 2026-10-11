// 2 Users for 1 minute: checks the scripts and the environment before a real run.
import { signInAll } from './lib/session.js';
import { journey } from './lib/journey.js';
import { thresholds } from './lib/config.js';

const USERS = +(__ENV.USERS || 2);

export const options = {
  vus: USERS,
  duration: __ENV.DURATION || '1m',
  thresholds: thresholds(),
};

export const setup = () => signInAll(USERS);
export default journey;
