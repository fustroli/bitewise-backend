import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();
process.env.S3_CDN_BASE_URL = 'https://cdn.example.com';

const { setupApp } = await import('../src/app.setup.js');
const { UserController } =
  await import('../src/modules/user/controller/index.js');
const { stubUser, User } =
  await import('../src/modules/user/entities/index.js');
const { ProfileService, StatisticsService } =
  await import('../src/modules/user/service/index.js');

const { AVATAR_MAX_BYTES } =
  await import('../src/modules/user/avatar/index.js');

const credentials = ['hash', 'googleId'];

describe('User responses (e2e)', () => {
  let app: INestApplication;

  let pending: { email: string; expiresAt: Date } | null = null;

  const user = () =>
    Object.assign(
      new User(),
      stubUser({
        hash: 'secret-hash',
        googleId: 'google-123',
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
            getPendingEmailChange: async () => pending,
            updateProfile: async () => user(),
            uploadAvatar: async () =>
              Object.assign(user(), { avatarKey: '1/avatar.webp' }),
          },
        },
        { provide: StatisticsService, useValue: {} },
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

    expect(res.body.avatarUrl).toBe('https://cdn.example.com/1/avatar.webp');
    expect(res.body).not.toHaveProperty('avatarKey');
    for (const field of credentials) expect(res.body).not.toHaveProperty(field);
  });

  it('POST /api/users/me/avatar 413s above 5 MB', async () => {
    await request(app.getHttpServer())
      .post('/api/users/me/avatar')
      .attach('file', Buffer.alloc(AVATAR_MAX_BYTES + 1), 'avatar.png')
      .expect(HttpStatus.PAYLOAD_TOO_LARGE);
  });

  it('GET /api/users/me has a null avatarUrl without an avatar', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/me');

    expect(res.body.avatarUrl).toBeNull();
  });

  it('GET /api/users/me has null pending email fields without an Email change', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/me');

    expect(res.body.pendingEmail).toBeNull();
    expect(res.body.pendingEmailExpiresAt).toBeNull();
  });

  it('GET /api/users/me has hasPassword true for a User with a password', async () => {
    const res = await request(app.getHttpServer()).get('/api/users/me');

    expect(res.body.hasPassword).toBe(true);
  });

  it('GET /api/users/me exposes a pending Email change', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    pending = { email: 'new@mail.com', expiresAt };
    try {
      const res = await request(app.getHttpServer()).get('/api/users/me');

      expect(res.body.pendingEmail).toBe('new@mail.com');
      expect(res.body.pendingEmailExpiresAt).toBe(expiresAt.toISOString());
    } finally {
      pending = null;
    }
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

  it.each([
    { bodyStats: null },
    { bodyStats: { heightCm: 99 } },
    { bodyStats: { heightCm: 251 } },
    { bodyStats: { heightCm: 170.5 } },
    { bodyStats: { weightKg: 29.9 } },
    { bodyStats: { weightKg: 300.1 } },
    { bodyStats: { weightKg: 70.25 } },
    { bodyStats: { weightKg: '70' } },
    { bodyStats: { sex: 'OTHER' } },
    { bodyStats: { activityLevel: 'LAZY' } },
    { bodyStats: { neckCm: 19.5 } },
    { bodyStats: { neckCm: 60.5 } },
    { bodyStats: { neckCm: 37.2 } },
    { bodyStats: { neckCm: '37' } },
    { bodyStats: { waistCm: 39.5 } },
    { bodyStats: { waistCm: 200.5 } },
    { bodyStats: { waistCm: 84.25 } },
    { bodyStats: { hipCm: 49.5 } },
    { bodyStats: { hipCm: 200.5 } },
    { bodyStats: { hipCm: 98.7 } },
  ])('PATCH /api/users/me rejects Body stats %o with 400', async (body) => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .send(body)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('PATCH /api/users/me accepts Body stats in range and null fields', async () => {
    for (const bodyStats of [
      {
        sex: 'FEMALE',
        heightCm: 100,
        weightKg: 30,
        activityLevel: 'EXTRA_ACTIVE',
      },
      { heightCm: 250, weightKg: 300 },
      { weightKg: 72.5 },
      { neckCm: 20, waistCm: 40, hipCm: 50 },
      { neckCm: 60, waistCm: 200, hipCm: 200 },
      { neckCm: 37.5, waistCm: 84.5, hipCm: 98.5 },
      {
        sex: null,
        heightCm: null,
        weightKg: null,
        activityLevel: null,
        neckCm: null,
        waistCm: null,
        hipCm: null,
      },
    ])
      await request(app.getHttpServer())
        .patch('/api/users/me')
        .send({ bodyStats })
        .expect(HttpStatus.OK);
  });

  it('GET /api/users/me returns Body stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .expect(HttpStatus.OK);

    expect(res.body.bodyStats).toEqual({
      sex: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      neckCm: null,
      waistCm: null,
      hipCm: null,
    });
  });

  it('PATCH /api/users/me accepts null fields and never returns credentials', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/users/me')
      .send({ personalInformation: { firstName: null, userName: 'john' } })
      .expect(HttpStatus.OK);

    for (const field of credentials) expect(res.body).not.toHaveProperty(field);
  });
});
