import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { UserController } =
  await import('../src/modules/user/controller/index.js');
const { stubUser, User } =
  await import('../src/modules/user/entities/index.js');
const { ProfileService } = await import('../src/modules/user/service/index.js');

const credentials = ['hash', 'googleId', 'facebookId'];

describe('User responses (e2e)', () => {
  let app: INestApplication;

  const user = () =>
    Object.assign(
      new User(),
      stubUser({
        hash: 'secret-hash',
        googleId: 'google-123',
        facebookId: 'facebook-123',
      }),
    );

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: ProfileService,
          useValue: {
            getProfile: async () => user(),
            updateProfile: async () => user(),
            uploadAvatar: async () =>
              Object.assign(user(), { avatarUrl: 'https://cdn/avatar.png' }),
          },
        },
        // Stands in for the global JwtGuard
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: ExecutionContext) => {
              context.switchToHttp().getRequest().user = {
                userId: 1,
                sessionId: 'session-1',
              };
              return true;
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/users/me never returns credentials', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .expect(HttpStatus.OK);

    expect(res.body.email).toBe('test@mail.com');
    for (const field of credentials) expect(res.body).not.toHaveProperty(field);
  });

  it('POST /api/users/me/avatar never returns credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users/me/avatar')
      .attach('file', Buffer.from('fake-image'), 'avatar.png')
      .expect(HttpStatus.CREATED);

    expect(res.body.avatarUrl).toBe('https://cdn/avatar.png');
    for (const field of credentials) expect(res.body).not.toHaveProperty(field);
  });

  it.each([
    { hash: 'x' },
    { refreshToken: 'x' },
    { googleId: 'x' },
    { email: 'new@mail.com' },
    { password: 'StrongPassword1!' },
  ])('PATCH /api/users/me rejects %o with 400', async (body) => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .send(body)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('PATCH /api/users/me rejects a null group and a null flag with 400', async () => {
    for (const body of [
      { personalInformation: null },
      { notificationSettings: { marketingEmail: null } },
    ])
      await request(app.getHttpServer())
        .patch('/api/users/me')
        .send(body)
        .expect(HttpStatus.BAD_REQUEST);
  });

  it('PATCH /api/users/me accepts null fields and never returns credentials', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .send({ personalInformation: { firstName: null, userName: 'john' } })
      .expect(HttpStatus.OK);

    for (const field of credentials) expect(res.body).not.toHaveProperty(field);
  });
});
