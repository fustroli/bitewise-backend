import { HttpStatus, INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { AuthController } =
  await import('../src/modules/auth/controller/index.js');
const {
  EmailChangeService,
  EmailVerificationService,
  PasswordResetService,
  SessionService,
} = await import('../src/modules/auth/services/index.js');
const { GoogleStrategy } =
  await import('../src/modules/auth/strategy/index.js');
const { default: googleOauthConfig } =
  await import('../src/modules/auth/config/google-oauth.config.js');
const { config } = await import('../src/config/index.js');

const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };

// The real Google strategy + guard; only the calls to Google are stubbed
describe('Google OAuth state (e2e)', () => {
  let app: INestApplication;
  let strategy: InstanceType<typeof GoogleStrategy>;

  const sessions = {
    signInSocial: jest.fn(async () => ({ tokens })),
  };

  const cookiesOf = (res: request.Response): string[] =>
    [res.headers['set-cookie'] ?? []].flat();

  const stateCookie = (res: request.Response) =>
    cookiesOf(res).find((c) => c.startsWith('oauthState='));

  const startLogin = async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/google/login')
      .expect(HttpStatus.FOUND);
    const state = new URL(res.headers.location).searchParams.get('state')!;
    return { res, state };
  };

  const failed = `${config.FRONTEND_URL}/?error=oauth-failed`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [AuthController],
      providers: [
        GoogleStrategy,
        { provide: SessionService, useValue: sessions },
        { provide: EmailVerificationService, useValue: {} },
        { provide: PasswordResetService, useValue: {} },
        { provide: EmailChangeService, useValue: {} },
        {
          provide: googleOauthConfig.KEY,
          useValue: {
            clientId: 'client-id',
            clientSecret: 'client-secret',
            callbackURL: 'http://localhost/api/auth/google/callback',
          },
        },
      ],
    }).compile();

    strategy = moduleRef.get(GoogleStrategy);
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('login sends a random state to Google and binds it to the browser in a Lax, path-scoped cookie', async () => {
    const { res, state } = await startLogin();

    expect(res.headers.location).toMatch(/^https:\/\/accounts\.google\.com\//);
    expect(state).toMatch(/^[\w-]{43}$/);
    const set = stateCookie(res)!;
    expect(set).toContain(`oauthState=${state};`);
    expect(set).toContain('HttpOnly');
    expect(set).toContain('SameSite=Lax');
    expect(set).toContain('Path=/api/auth/google');
    expect(set).toContain('Max-Age=600');

    const { state: next } = await startLogin();
    expect(next).not.toBe(state);
  });

  it('a callback whose state matches the cookie signs in', async () => {
    const profile = { id: 'g-1', emails: [{ value: 'a@b.c', verified: true }] };
    jest
      .spyOn(strategy['_oauth2'], 'getOAuthAccessToken')
      .mockImplementation((_code, _params, cb) => cb(null, 'at', 'rt', {}));
    jest
      .spyOn(strategy, 'userProfile')
      .mockImplementation((_at, done) => done(null, profile as never));

    const { state } = await startLogin();
    const res = await request(app.getHttpServer())
      .get(`/api/auth/google/callback?code=c&state=${state}`)
      .set('Cookie', `oauthState=${state}`)
      .expect(HttpStatus.FOUND);

    expect(res.headers.location).toBe(`${config.FRONTEND_URL}/dashboard`);
    expect(sessions.signInSocial).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google', providerId: 'g-1' }),
    );
    expect(stateCookie(res)).toContain('Expires=Thu, 01 Jan 1970');
  });

  it.each([
    ['a mismatched state', 'state=attacker', 'oauthState=victim'],
    ['no state cookie (login CSRF)', 'state=attacker', null],
    ['no state param', '', 'oauthState=victim'],
  ])(
    'a callback with %s redirects to the frontend without signing in',
    async (_case, query, cookie) => {
      const req = request(app.getHttpServer()).get(
        `/api/auth/google/callback?code=c&${query}`,
      );
      if (cookie) req.set('Cookie', cookie);
      const res = await req.expect(HttpStatus.FOUND);

      expect(res.headers.location).toBe(failed);
      expect(sessions.signInSocial).not.toHaveBeenCalled();
      expect(cookiesOf(res).some((c) => c.startsWith('accessToken='))).toBe(
        false,
      );
      expect(stateCookie(res)).toContain('Expires=Thu, 01 Jan 1970');
    },
  );

  it('the user cancelling at Google redirects to the frontend', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/google/callback?error=access_denied')
      .expect(HttpStatus.FOUND);

    expect(res.headers.location).toBe(failed);
    expect(sessions.signInSocial).not.toHaveBeenCalled();
  });
});
