import {
  Controller,
  Get,
  HttpStatus,
  INestApplication,
  Req,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { setupApp } = await import('../src/app.setup.js');
const { config } = await import('../src/config/index.js');

// ThrottlerGuard's default tracker is req.ip, so asserting req.ip covers the
// throttler key without loading @nestjs/throttler (see throttler.mock.ts).
@Controller('probe')
class ProbeController {
  @Get()
  probe(@Req() req: Request) {
    return { ip: req.ip };
  }
}

// Prod: CloudFront + nginx
const PROD_HOPS = 2;

describe('Client IP resolution (e2e)', () => {
  const originalHops = config.TRUST_PROXY_HOPS;

  const appWithHops = async (hops: number): Promise<INestApplication> => {
    config.TRUST_PROXY_HOPS = hops;
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    const app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    return app;
  };

  const ipOf = async (app: INestApplication, forwardedFor?: string) => {
    const req = request(app.getHttpServer()).get('/api/probe');
    if (forwardedFor) req.set('X-Forwarded-For', forwardedFor);
    const res = await req.expect(HttpStatus.OK);
    return res.body.ip as string;
  };

  afterAll(() => {
    config.TRUST_PROXY_HOPS = originalHops;
  });

  describe('behind CloudFront + nginx (2 hops)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await appWithHops(PROD_HOPS);
    });

    afterAll(() => app.close());

    it('resolves the viewer IP CloudFront appended', async () => {
      expect(await ipOf(app, '203.0.113.7, 130.176.0.1')).toBe('203.0.113.7');
    });

    it('ignores a client-supplied X-Forwarded-For', async () => {
      expect(await ipOf(app, '6.6.6.6, 203.0.113.7, 130.176.0.1')).toBe(
        '203.0.113.7',
      );
    });

    it('resolves the end-user IP the Next server forwards over loopback', async () => {
      expect(await ipOf(app, '198.51.100.4')).toBe('198.51.100.4');
    });
  });

  describe('without a proxy (0 hops)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await appWithHops(0);
    });

    afterAll(() => app.close());

    it('ignores X-Forwarded-For and uses the socket address', async () => {
      expect(await ipOf(app, '203.0.113.7')).toMatch(/127\.0\.0\.1|::1/);
    });
  });
});
