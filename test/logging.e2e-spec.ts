import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpStatus,
  INestApplication,
  Logger as NestLogger,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger, LoggerModule } from 'nestjs-pino';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { config } = await import('../src/config/index.js');
const { loggerParams, MAX_REQUEST_ID_LENGTH } =
  await import('../src/common/logging/index.js');

const USER_ID = 42;

// stands in for JwtGuard: sets req.user after pino-http has started the request
class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getRequest().user = {
      userId: USER_ID,
      sessionId: 'sid-1',
    };
    return true;
  }
}

@Controller('probe')
class ProbeController {
  private readonly logger = new NestLogger('Probe');

  @Get()
  probe() {
    return { ok: true };
  }

  @Get('me')
  @UseGuards(FakeJwtGuard)
  me() {
    return { ok: true };
  }

  @Get('boom')
  boom() {
    throw new Error('kaboom');
  }

  @Get('secrets')
  secrets() {
    this.logger.log({
      msg: 'leaky',
      password: 'hunter2-password',
      body: { refreshToken: 'refresh-secret' },
    });
    return { ok: true };
  }
}

interface ILogLine {
  level: number;
  msg: string;
  reqId?: string;
  userId?: number;
  responseTime?: number;
  context?: string;
  req?: { id: string; method: string; path: string };
  res?: { statusCode: number };
  err?: { message: string; stack: string };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ERROR_LEVEL = 50;
const POLL_ATTEMPTS = 50;
const POLL_INTERVAL_MS = 10;

describe('Request logging (e2e)', () => {
  const originalHops = config.TRUST_PROXY_HOPS;
  let app: INestApplication;
  let output = '';

  const stream = {
    write: (line: string) => {
      output += line;
    },
  };

  const lines = (): ILogLine[] =>
    output
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));

  // the access log line is written on 'finish', which can trail the response
  const accessLog = async (reqId: string) => {
    for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
      const line = lines().find((l) => l.req?.id === reqId && l.res);
      if (line) return line;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    throw new Error(`no access log for ${reqId}`);
  };

  const get = (path: string) => request(app.getHttpServer()).get(path);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [LoggerModule.forRoot(loggerParams({ level: 'info', stream }))],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    app.useLogger(app.get(Logger));
    setupApp(app);
    await app.init();
  });

  beforeEach(() => {
    output = '';
    config.TRUST_PROXY_HOPS = 2;
  });

  afterAll(async () => {
    config.TRUST_PROXY_HOPS = originalHops;
    await app.close();
  });

  describe('X-Request-Id', () => {
    it('generates a uuid and echoes it when none is sent', async () => {
      const res = await get('/api/probe').expect(HttpStatus.OK);
      expect(res.headers['x-request-id']).toMatch(UUID);
    });

    it('honours a well-formed id from a trusted proxy', async () => {
      const res = await get('/api/probe')
        .set('X-Request-Id', 'edge-abc.123:x')
        .expect(HttpStatus.OK);
      expect(res.headers['x-request-id']).toBe('edge-abc.123:x');
    });

    it.each([
      ['junk characters', 'bad id\twith "quotes"'],
      ['an overlong id', 'a'.repeat(MAX_REQUEST_ID_LENGTH + 1)],
    ])('replaces %s with a fresh uuid', async (_label, id) => {
      const res = await get('/api/probe')
        .set('X-Request-Id', id)
        .expect(HttpStatus.OK);
      expect(res.headers['x-request-id']).toMatch(UUID);
    });

    it('ignores an incoming id when no proxy is trusted', async () => {
      config.TRUST_PROXY_HOPS = 0;
      const res = await get('/api/probe')
        .set('X-Request-Id', 'client-chosen')
        .expect(HttpStatus.OK);
      expect(res.headers['x-request-id']).toMatch(UUID);
    });
  });

  describe('access log', () => {
    it('logs method, path, status, duration and request id', async () => {
      const res = await get('/api/probe?secret=oauth-code').expect(
        HttpStatus.OK,
      );
      const reqId = res.headers['x-request-id'];

      const line = await accessLog(reqId);
      expect(line).toMatchObject({
        reqId,
        req: { id: reqId, method: 'GET', path: '/api/probe' },
        res: { statusCode: HttpStatus.OK },
      });
      expect(line.responseTime).toEqual(expect.any(Number));
      expect(line.userId).toBeUndefined();
      expect(output).not.toContain('oauth-code');
    });

    it('includes the userId the auth guard set', async () => {
      const res = await get('/api/probe/me').expect(HttpStatus.OK);

      const line = await accessLog(res.headers['x-request-id']);
      expect(line.userId).toBe(USER_ID);
    });

    it('never logs credentials or cookies', async () => {
      const res = await get('/api/probe/secrets')
        .set('Authorization', 'Bearer access-jwt-secret')
        .set('Cookie', 'refresh_token=cookie-secret')
        .expect(HttpStatus.OK);
      await accessLog(res.headers['x-request-id']);

      for (const secret of [
        'access-jwt-secret',
        'cookie-secret',
        'hunter2-password',
        'refresh-secret',
      ]) {
        expect(output).not.toContain(secret);
      }
      expect(lines().find((l) => l.msg === 'leaky')).toMatchObject({
        password: '[Redacted]',
        body: { refreshToken: '[Redacted]' },
      });
    });
  });

  describe('unhandled errors', () => {
    it('logs the stack with the request id', async () => {
      const res = await get('/api/probe/boom').expect(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      const reqId = res.headers['x-request-id'];
      const access = await accessLog(reqId);
      // only the real error carries a stack, not pino-http's stand-in
      expect(access).toMatchObject({ level: ERROR_LEVEL });
      expect(access.err).toBeUndefined();

      const errorLine = lines().find((l) => l.err?.message === 'kaboom');
      expect(errorLine).toMatchObject({ level: ERROR_LEVEL, reqId });
      expect(errorLine.err.stack).toContain('ProbeController.boom');
      expect(res.body).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    });
  });
});
