import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { config } from './config/index.js';
import helmet from 'helmet';
import { initializeSwagger } from './swagger/index.js';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = config.PORT;

  //secure app by setting HTTP response headers
  app.use(helmet());

  app.use(cookieParser());

  //enable cors
  app.enableCors({ origin: config.FRONTEND_URL, credentials: true });

  //validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(json({ limit: '20kb' }));

  initializeSwagger(app);
  await app.listen(port);
}
bootstrap();
