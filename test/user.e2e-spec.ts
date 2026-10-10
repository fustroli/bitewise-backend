import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

// @nestjs/throttler is CommonJS and require()s ESM @nestjs/common, which Jest's
// VM modules can't do on Node 22. Throttling isn't under test, so stub it out.
class ThrottlerGuard {
  canActivate() {
    return true;
  }
}
jest.unstable_mockModule('@nestjs/throttler', () => ({ ThrottlerGuard }));

const { setupApp } = await import('../src/app.setup.js');
const { JwtGuard } = await import('../src/modules/auth/guard/index.js');
const { UserController } =
  await import('../src/modules/user/controller/index.js');
const { stubUser, User } =
  await import('../src/modules/user/entities/index.js');
const { UserService } = await import('../src/modules/user/service/index.js');

const credentials = ['hash', 'googleId'];

describe('User responses (e2e)', () => {
  let app: INestApplication;

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
          provide: UserService,
          useValue: {
            uploadAvatar: async () =>
              Object.assign(user(), { avatarUrl: 'https://cdn/avatar.png' }),
          },
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = user();
          return true;
        },
      })
      .compile();

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
});
