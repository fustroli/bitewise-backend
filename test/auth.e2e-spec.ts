import {
  ConflictException,
  ExecutionContext,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { AuthController } =
  await import('../src/modules/auth/controller/index.js');
const { SessionService } =
  await import('../src/modules/auth/services/index.js');
const { GoogleAuthGuard } = await import('../src/modules/auth/guard/index.js');
const { Session } = await import('../src/modules/auth/entities/index.js');
const { stubUser, User } =
  await import('../src/modules/user/entities/index.js');
const { config } = await import('../src/config/index.js');

const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };
const credentials = { email: 'test@mail.com', password: 'StrongPassword1!' };

// Stands in for the OAuth round trip: the strategy's profile is on req.user
const profile = { provider: 'google', providerId: 'g-1' };
const oauth = {
  canActivate: (ctx: ExecutionContext) => {
    ctx.switchToHttp().getRequest().user = profile;
    return true;
  },
};

const cookiesOf = (res: request.Response): string[] =>
  [res.headers['set-cookie'] ?? []].flat();

const cookie = (res: request.Response, name: string) =>
  cookiesOf(res).find((c) => c.startsWith(`${name}=`));

const expectCleared = (res: request.Response) => {
  for (const name of ['accessToken', 'refreshToken']) {
    const set = cookie(res, name);
    expect(set).toContain(`${name}=;`);
    expect(set).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    expect(set).toContain('Path=/');
  }
};

describe('Auth cookies (e2e)', () => {
  let app: INestApplication;

  const user = () =>
    Object.assign(new User(), stubUser({ hash: 'secret-hash' }));

  const sessions = {
    signIn: jest.fn(async () => ({ user: user(), tokens })),
    rotate: jest.fn(async () => ({ user: user(), tokens })),
    signInSocial: jest.fn(async () => ({ user: user(), tokens })),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [AuthController],
      providers: [{ provide: SessionService, useValue: sessions }],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue(oauth)
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('POST /api/auth/signin sets both tokens as httpOnly cookies and returns the User', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send(credentials)
      .expect(HttpStatus.OK);

    for (const [name, value] of [
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
    ]) {
      const set = cookie(res, name);
      expect(set).toContain(`${name}=${value};`);
      expect(set).toMatch(/Max-Age=\d+/);
      expect(set).toContain('HttpOnly');
      expect(set).toContain('SameSite=Lax');
      expect(set).toContain('Path=/');
    }
    expect(res.body.email).toBe('test@mail.com');
    expect(res.body).not.toHaveProperty('hash');
  });

  it('POST /api/auth/refresh rotates the Bearer refresh token and resets the cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', 'Bearer old-refresh-jwt')
      .expect(HttpStatus.OK);

    expect(sessions.rotate).toHaveBeenCalledWith('old-refresh-jwt');
    expect(cookie(res, 'accessToken')).toContain('accessToken=access-jwt;');
    expect(cookie(res, 'refreshToken')).toContain('refreshToken=refresh-jwt;');
  });

  it('POST /api/auth/refresh without a Bearer token is a 401 and sets no cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .expect(HttpStatus.UNAUTHORIZED);

    expect(sessions.rotate).not.toHaveBeenCalled();
    expect(cookiesOf(res)).toEqual([]);
  });

  describe.each(['google'])('GET /api/auth/%s/callback', (provider) => {
    const url = `/api/auth/${provider}/callback`;

    it('sets both cookies and redirects to the dashboard', async () => {
      const res = await request(app.getHttpServer())
        .get(url)
        .expect(HttpStatus.FOUND);

      expect(sessions.signInSocial).toHaveBeenCalledWith(profile);
      expect(res.headers.location).toBe(`${config.FRONTEND_URL}/dashboard`);
      expect(cookie(res, 'accessToken')).toContain('accessToken=access-jwt;');
      expect(cookie(res, 'refreshToken')).toContain(
        'refreshToken=refresh-jwt;',
      );
    });

    it('redirects to sign-in with password-first, setting no cookies, when the email needs a password sign-in', async () => {
      sessions.signInSocial.mockRejectedValueOnce(
        new ConflictException('Sign in with your password first'),
      );

      const res = await request(app.getHttpServer())
        .get(url)
        .expect(HttpStatus.FOUND);

      expect(res.headers.location).toBe(
        `${config.FRONTEND_URL}/?error=password-first`,
      );
      expect(cookiesOf(res)).toEqual([]);
    });

    it('lets other failures through', async () => {
      sessions.signInSocial.mockRejectedValueOnce(new Error('boom'));

      await request(app.getHttpServer())
        .get(url)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});

// The real SessionService over a stubbed Session repository: what reaches the
// database is the assertion
describe('POST /api/auth/signout (e2e)', () => {
  let app: INestApplication;
  const jwt = new JwtService();
  const sessionRepo = { delete: jest.fn(async () => ({ affected: 1 })) };

  const refreshToken = (claims: object, secret = 'refresh-secret') =>
    jwt.signAsync({ jti: 'jti-1', ...claims }, { secret });

  const signout = (token?: string) => {
    const req = request(app.getHttpServer()).post('/api/auth/signout');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    config.JWT.REFRESH_TOKEN_SECRET = 'refresh-secret';

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [AuthController],
      providers: [
        SessionService,
        { provide: JwtService, useValue: jwt },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Session), useValue: sessionRepo },
      ],
    })
      .overrideGuard(GoogleAuthGuard)
      .useValue(oauth)
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('ends the Session and clears both cookies', async () => {
    const token = await refreshToken({ sub: 1, sid: 'sid-1' });

    const res = await signout(token).expect(HttpStatus.NO_CONTENT);

    expect(sessionRepo.delete).toHaveBeenCalledWith({
      id: 'sid-1',
      user: { id: 1 },
    });
    expectCleared(res);
  });

  it('ends the Session of an expired refresh token and clears both cookies', async () => {
    const token = await refreshToken({
      sub: 1,
      sid: 'sid-1',
      // Expired at the epoch's first second
      exp: 1,
    });

    const res = await signout(token).expect(HttpStatus.NO_CONTENT);

    expect(sessionRepo.delete).toHaveBeenCalledWith({
      id: 'sid-1',
      user: { id: 1 },
    });
    expectCleared(res);
  });

  it.each([
    ['garbage', async () => 'garbage'],
    [
      'a token with the wrong signature',
      () => refreshToken({ sub: 1, sid: 'sid-1' }, 'not-the-secret'),
    ],
    ['a token without a Session id', () => refreshToken({ sub: 1 })],
    ['no token', async () => undefined],
  ])('only clears both cookies for %s', async (_label, token) => {
    const res = await signout(await token()).expect(HttpStatus.NO_CONTENT);

    expect(sessionRepo.delete).not.toHaveBeenCalled();
    expectCleared(res);
  });
});
