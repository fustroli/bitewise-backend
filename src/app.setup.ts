import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { DuplicateEntryFilter } from './common/filters/index.js';
import { config } from './config/index.js';

// Shared by main.ts and e2e tests so both run the same request/response pipeline.
export function setupApp(app: INestApplication) {
  //resolve req.ip (the throttler's tracker) to the client, not the proxy in front
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', config.TRUST_PROXY_HOPS);

  //serve all routes under /api
  app.setGlobalPrefix('api');

  //validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  //safety net: strips @Exclude()d fields from any class instance in a response
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  //unique-index violations (e.g. per-Owner names) → 409
  app.useGlobalFilters(
    new DuplicateEntryFilter(app.get(HttpAdapterHost).httpAdapter),
  );
}
