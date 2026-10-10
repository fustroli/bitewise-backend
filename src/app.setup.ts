import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { DuplicateEntryFilter } from './common/filters/index.js';

// Shared by main.ts and e2e tests so both run the same request/response pipeline.
export function setupApp(app: INestApplication) {
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
