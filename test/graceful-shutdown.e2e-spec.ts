import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { setTimeout as sleep } from 'node:timers/promises';
import request from 'supertest';

import { mockThrottler } from './throttler.mock.js';

mockThrottler();

const { TypeOrmHealthIndicator } = await import('@nestjs/terminus');
const { setupApp } = await import('../src/app.setup.js');
const { config } = await import('../src/config/index.js');
const { HealthModule } = await import('../src/modules/health/health.module.js');

const DRAIN_MS = 500;
// long enough for close() to reach beforeApplicationShutdown
const SHUTDOWN_START_MS = 50;

describe('Graceful shutdown (e2e)', () => {
  const originalDrain = config.SHUTDOWN_DRAIN_MS;
  let app: INestApplication;

  beforeAll(async () => {
    config.SHUTDOWN_DRAIN_MS = DRAIN_MS;
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(TypeOrmHealthIndicator)
      .useValue({ pingCheck: (key: string) => ({ [key]: { status: 'up' } }) })
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.listen(0);
  });

  afterAll(() => {
    config.SHUTDOWN_DRAIN_MS = originalDrain;
  });

  it('fails readiness while draining, keeps serving, then closes', async () => {
    const server = app.getHttpServer();
    await request(server).get('/api/health/ready').expect(HttpStatus.OK);

    const closed = app.close();
    await sleep(SHUTDOWN_START_MS);

    const ready = await request(server)
      .get('/api/health/ready')
      .expect(HttpStatus.SERVICE_UNAVAILABLE);
    expect(ready.body.error).toEqual({
      shutdown: { status: 'down', message: 'shutting down' },
    });
    // still serving other requests until the drain delay is up
    await request(server).get('/api/health').expect(HttpStatus.OK);

    await closed;
    expect(server.listening).toBe(false);
  });
});
