import { Controller, Get, HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { setupApp } from '../src/app.setup.js';

@Controller('probe')
class ProbeController {
  @Get('large')
  large() {
    return { items: Array.from({ length: 300 }, (_, id) => ({ id })) };
  }

  @Get('small')
  small() {
    return { ok: true };
  }
}

// supertest decompresses bodies, so assert on headers
describe('Response compression (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  //superagent sends gzip/deflate by default, so always set it explicitly
  const get = (path: string, acceptEncoding = '') =>
    request(app.getHttpServer())
      .get(`/api/probe/${path}`)
      .set('Accept-Encoding', acceptEncoding)
      .expect(HttpStatus.OK);

  it('gzips a body over the threshold', async () => {
    const res = await get('large', 'gzip');
    expect(res.headers['content-encoding']).toBe('gzip');
    expect(res.headers['vary']).toMatch(/Accept-Encoding/i);
  });

  it('prefers brotli when accepted', async () => {
    const res = await get('large', 'gzip, deflate, br');
    expect(res.headers['content-encoding']).toBe('br');
  });

  it('does not compress without Accept-Encoding', async () => {
    const res = await get('large');
    expect(res.headers['content-encoding']).toBeUndefined();
    expect(res.headers['vary']).toMatch(/Accept-Encoding/i);
  });

  it('does not compress a body under the threshold', async () => {
    const res = await get('small', 'gzip');
    expect(res.headers['content-encoding']).toBeUndefined();
  });
});
