import { HttpStatus, INestApplication, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { config } = await import('../src/config/index.js');
const { AppModule } = await import('../src/app.module.js');
const { setupApp } = await import('../src/app.setup.js');
const { createSwaggerDocument } = await import('../src/swagger/index.js');
const { AuthModule } = await import('../src/modules/auth/auth.module.js');
const { SessionService } =
  await import('../src/modules/auth/services/index.js');
const { IS_PUBLIC_KEY } =
  await import('../src/modules/auth/decorators/index.js');
const { default: googleOauthConfig } =
  await import('../src/modules/auth/config/google-oauth.config.js');

type TClass = new (...args: never[]) => unknown;

interface IRoute {
  method: string;
  // e.g. /api/meal/:mealId
  path: string;
  url: string;
  isPublic: boolean;
}

// Every controller registered through AppModule's feature modules
const controllers: TClass[] = (
  Reflect.getMetadata('imports', AppModule) as unknown[]
)
  .filter((m): m is TClass => typeof m === 'function')
  .flatMap((m) => Reflect.getMetadata('controllers', m) ?? []);

function routesOf(controller: TClass): IRoute[] {
  const base: string = Reflect.getMetadata(PATH_METADATA, controller);
  const prototype = controller.prototype;

  return Object.getOwnPropertyNames(prototype)
    .map((name) => prototype[name])
    .filter((handler) => Reflect.hasMetadata(METHOD_METADATA, handler))
    .map((handler) => {
      const path: string = Reflect.getMetadata(PATH_METADATA, handler);
      const method: RequestMethod = Reflect.getMetadata(
        METHOD_METADATA,
        handler,
      );
      const fullPath = `/api/${base}/${path}`
        .replace(/\/+/g, '/')
        .replace(/\/$/, '');
      return {
        method: RequestMethod[method].toLowerCase(),
        path: fullPath,
        url: fullPath.replace(/:\w+/g, '1'),
        isPublic:
          Reflect.getMetadata(IS_PUBLIC_KEY, handler) ??
          Reflect.getMetadata(IS_PUBLIC_KEY, controller) ??
          false,
      };
    });
}

const routes = controllers.flatMap(routesOf);

// Opening a route up must be a deliberate change here as well as @Public()
const PUBLIC_ROUTES = [
  'POST /api/auth/signup',
  'POST /api/auth/signin',
  'POST /api/auth/refresh',
  'POST /api/auth/signout',
  'POST /api/auth/verify-email',
  'POST /api/auth/password-reset',
  'POST /api/auth/password-reset/confirm',
  'POST /api/auth/email-change/confirm',
  'POST /api/auth/email-change/cancel',
  'GET /api/auth/google/login',
  'GET /api/auth/google/callback',
  'GET /api/health',
  'GET /api/health/ready',
];
const label = (route: IRoute) => `${route.method.toUpperCase()} ${route.url}`;

describe('Route authentication (e2e)', () => {
  let app: INestApplication;

  const call = (route: IRoute) =>
    request(app.getHttpServer())[route.method](route.url).send({});

  beforeAll(async () => {
    config.JWT.ACCESS_TOKEN_SECRET = 'access-secret';

    const fakeOAuth = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      callbackURL: 'http://localhost/callback',
    };

    const moduleRef = await Test.createTestingModule({
      controllers,
      providers: [
        // AuthModule's wiring as is (global JwtGuard, strategies)...
        ...(Reflect.getMetadata('providers', AuthModule) as unknown[]).filter(
          (provider) => provider !== SessionService,
        ),
        // ...minus the database: refresh tokens are accepted as-is
        {
          provide: SessionService,
          useValue: {
            rotate: async () => ({ user: {}, tokens: {} }),
            signOut: async () => undefined,
          },
        },
      ],
    })
      // Every other dependency (feature services, repositories, Terminus)
      .useMocker((token) => (token === googleOauthConfig.KEY ? fakeOAuth : {}))
      .compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('discovers every route Express has registered', () => {
    const { router } = app.getHttpAdapter().getInstance();
    const registered = router.stack.filter(
      (layer: { route?: unknown }) => layer.route,
    );

    expect(routes.length).toBeGreaterThan(0);
    expect(routes).toHaveLength(registered.length);
  });

  it('makes exactly the intended routes public', () => {
    expect(
      routes
        .filter((route) => route.isPublic)
        .map(label)
        .sort(),
    ).toEqual([...PUBLIC_ROUTES].sort());
  });

  // Public routes override the global { bearer: [] } requirement (refresh and
  // sign-out with their own Bearer refresh token); the rest inherit it
  it('documents the global bearer requirement on exactly the non-public routes', () => {
    const { paths } = createSwaggerDocument(app);

    for (const route of routes) {
      const operation =
        paths[route.path.replace(/:(\w+)/g, '{$1}')]?.[route.method];

      expect(operation).toBeDefined();
      if (route.isPublic) expect(operation.security).toBeDefined();
      else expect(operation.security).toBeUndefined();
    }
  });

  describe.each(
    routes.filter((route) => !route.isPublic).map((r) => [label(r), r]),
  )('%s', (_label, route) => {
    it('401s without a token', async () => {
      await call(route).expect(HttpStatus.UNAUTHORIZED);
    });

    it('401s with something that is not an access token', async () => {
      await call(route)
        .set('Authorization', 'Bearer not-an-access-token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // Refresh and sign-out take a refresh token instead; the stubbed
  // SessionService accepts any, so a 401 here can only come from JwtGuard
  it.each(routes.filter((route) => route.isPublic).map((r) => [label(r), r]))(
    '%s is public',
    async (_label, route) => {
      const res = await call(route).set(
        'Authorization',
        'Bearer not-an-access-token',
      );

      expect(res.status).not.toBe(HttpStatus.UNAUTHORIZED);
    },
  );
});
