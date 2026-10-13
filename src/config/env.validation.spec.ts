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
  S3_REGION: 'eu-central-1',
  S3_BUCKET: 'bucket',
  S3_CDN_BASE_URL: 'https://cdn.example.com',
  MAIL_TRANSPORT: 'log',
  MAIL_FROM: 'BiteWise <no-reply@example.com>',
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
        SHUTDOWN_DRAIN_MS: '',
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
    ['SHUTDOWN_DRAIN_MS', '-1'],
    ['SWAGGER_ENABLED', 'yes'],
    ['TYPEORM_PORT', '70000'],
    ['TYPEORM_PASSWORD', ''],
    ['MAIL_TRANSPORT', 'sendgrid'],
    ['MAIL_FROM', 'BiteWise'],
  ])('rejects %s=%p', (key, value) => {
    expect(invalidKeys({ ...validEnv, [key]: value })).toEqual([key]);
  });

  it('requires AWS_REGION for the ses transport only', () => {
    expect(invalidKeys({ ...validEnv, MAIL_TRANSPORT: 'ses' })).toEqual([
      'AWS_REGION',
    ]);
    expect(
      validateEnv({
        ...validEnv,
        MAIL_TRANSPORT: 'ses',
        AWS_REGION: 'eu-central-1',
      }),
    ).toEqual([]);
  });

  it('requires SMTP_HOST and SMTP_PORT for the smtp transport only', () => {
    expect(invalidKeys({ ...validEnv, MAIL_TRANSPORT: 'smtp' }).sort()).toEqual(
      ['SMTP_HOST', 'SMTP_PORT'],
    );
    expect(
      validateEnv({
        ...validEnv,
        MAIL_TRANSPORT: 'smtp',
        SMTP_HOST: 'localhost',
        SMTP_PORT: '1025',
      }),
    ).toEqual([]);
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
