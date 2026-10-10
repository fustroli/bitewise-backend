import { HttpStatus, INestApplication } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { AuthController } =
  await import('../src/modules/auth/controller/index.js');
const { SessionService } =
  await import('../src/modules/auth/services/index.js');
const { stubUser, User } =
  await import('../src/modules/user/entities/index.js');

const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };
const credentials = { email: 'test@mail.com', password: 'StrongPassword1!' };

describe('Auth cookies (e2e)', () => {
  let app: INestApplication;

  const user = () =>
    Object.assign(new User(), stubUser({ hash: 'secret-hash' }));

  const sessions = {
    signIn: jest.fn(async () => ({ user: user(), tokens })),
    rotate: jest.fn(async () => ({ user: user(), tokens })),
    verifyRefreshToken: jest.fn(async () => ({ sub: 1, sid: 'sid-1' })),
    signOut: jest.fn(async () => undefined),
  };

  const cookiesOf = (res: request.Response): string[] =>
    [res.headers['set-cookie'] ?? []].flat();

  const cookie = (res: request.Response, name: string) =>
    cookiesOf(res).find((c) => c.startsWith(`${name}=`));

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule.register({})],
      controllers: [AuthController],
      providers: [{ provide: SessionService, useValue: sessions }],
    }).compile();

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
      expect(set).toContain('SameSite=Strict');
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

  it('POST /api/auth/signout ends the Session and clears both cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer refresh-jwt')
      .expect(HttpStatus.NO_CONTENT);

    expect(sessions.verifyRefreshToken).toHaveBeenCalledWith('refresh-jwt');
    expect(sessions.signOut).toHaveBeenCalledWith('sid-1');
    for (const name of ['accessToken', 'refreshToken']) {
      const set = cookie(res, name);
      expect(set).toContain(`${name}=;`);
      expect(set).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      expect(set).toContain('Path=/');
    }
  });
});
