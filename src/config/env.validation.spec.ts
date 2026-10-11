import { assertValidEnv, validateEnv } from './env.validation.js';

const secret = 'x'.repeat(32);

const validEnv = {
  PORT: '8000',
  FRONTEND_URL: 'http://localhost:3000',
  SALT_WORK_FACTOR: '10',
  NODE_ENV: 'development',
  ACCESS_TOKEN_SECRET: secret,
  ACCESS_TOKEN_EXPIRATION: '15m',
  REFRESH_TOKEN_SECRET: secret,
  REFRESH_TOKEN_EXPIRATION: '7d',
  THROTTLER_LIMIT: '100',
  THROTTLER_TTL: '60000',
  TYPEORM_HOST: 'localhost',
  TYPEORM_PORT: '3306',
  TYPEORM_USERNAME: 'bitewise',
  TYPEORM_PASSWORD: 'password',
  TYPEORM_DATABASE_DEV: 'bitewise',
  GOOGLE_CLIENT_ID: 'client-id',
  GOOGLE_SECRET: 'google-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:8000/api/auth/google/callback',
  GCP_PROJECT_ID: 'project',
  GCP_PRIVATE_KEY_FILE: 'key.json',
  GCP_BUCKET_NAME: 'bucket',
};

const invalidKeys = (env: NodeJS.ProcessEnv) =>
  validateEnv(env).map((message) => message.split(':')[0]);

describe('validateEnv', () => {
  it('accepts a complete env', () => {
    expect(validateEnv(validEnv)).toEqual([]);
  });

  it('treats optional keys left empty as unset', () => {
    expect(
      validateEnv({
        ...validEnv,
        COOKIE_DOMAIN: '',
        TRUST_PROXY_HOPS: '',
        SWAGGER_ENABLED: '',
      }),
    ).toEqual([]);
  });

  it('lists every missing required key', () => {
    expect(invalidKeys({}).sort()).toEqual(Object.keys(validEnv).sort());
  });

  it.each([
    ['PORT', 'abc'],
    ['FRONTEND_URL', 'localhost:3000'],
    ['SALT_WORK_FACTOR', '9'],
    ['NODE_ENV', 'prod'],
    ['ACCESS_TOKEN_SECRET', 'short'],
    ['REFRESH_TOKEN_EXPIRATION', 'soon'],
    ['ACCESS_TOKEN_EXPIRATION', '0s'],
    ['THROTTLER_TTL', '1.5'],
    ['TRUST_PROXY_HOPS', '-1'],
    ['SWAGGER_ENABLED', 'yes'],
    ['TYPEORM_PORT', '70000'],
    ['TYPEORM_PASSWORD', ''],
  ])('rejects %s=%p', (key, value) => {
    expect(invalidKeys({ ...validEnv, [key]: value })).toEqual([key]);
  });
});

describe('assertValidEnv', () => {
  it('throws naming each invalid key', () => {
    expect(() =>
      assertValidEnv({ ...validEnv, PORT: '', SALT_WORK_FACTOR: '4' }),
    ).toThrow(/PORT[\s\S]*SALT_WORK_FACTOR/);
  });

  it('passes on a valid env', () => {
    expect(() => assertValidEnv(validEnv)).not.toThrow();
  });
});
