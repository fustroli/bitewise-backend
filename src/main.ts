import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { NestFactory } from '@nestjs/core';
import { assertValidEnv, config } from './config/index.js';
import helmet from 'helmet';
import { initializeSwagger } from './swagger/index.js';
import { json } from 'express';
import { setupApp } from './app.setup.js';

async function bootstrap() {
  //refuse to boot on missing/invalid env, listing every bad key
  assertValidEnv();

  const app = await NestFactory.create(AppModule);
  const port = config.PORT;

  setupApp(app);

  //secure app by setting HTTP response headers
  app.use(helmet());

  app.use(cookieParser());

  //enable cors
  app.enableCors({ origin: config.FRONTEND_URL, credentials: true });

  app.use(json({ limit: '20kb' }));

  //API docs expose every route: off in production by default
  if (config.SWAGGER_ENABLED) initializeSwagger(app);
  await app.listen(port);
}
bootstrap();
