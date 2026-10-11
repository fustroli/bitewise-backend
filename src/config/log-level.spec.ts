import { logLevel } from './index.js';

describe('logLevel', () => {
  it.each([
    [{ NODE_ENV: 'development' }, 'debug'],
    [{ NODE_ENV: 'test' }, 'silent'],
    [{ NODE_ENV: 'production' }, 'info'],
    [{ NODE_ENV: 'production', LOG_LEVEL: '' }, 'info'],
    [{ NODE_ENV: 'production', LOG_LEVEL: 'warn' }, 'warn'],
    [{ NODE_ENV: 'test', LOG_LEVEL: 'debug' }, 'debug'],
  ])('%p → %p', (env, expected) => {
    expect(logLevel(env)).toBe(expected);
  });
});
