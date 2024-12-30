import * as cookieParser from 'cookie-parser';
import * as passport from 'passport';
import * as session from 'express-session';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import Redis from 'ioredis'; // eslint-disable-line
import { RedisService } from 'src/modules/redis/service';
import { RedisStore } from 'connect-redis';
import { ValidationPipe } from '@nestjs/common';
import { config } from './config';
import helmet from 'helmet';
import { initializeSwagger } from './swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = config.PORT;

  const redisService = app.get(RedisService);
  const redisClient = redisService.getClient();

  const redisStore = new RedisStore({
    client: redisClient,
  });

  app.use(
    session({
      store: redisStore,
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 60000, //1000 * 60 * 60 * 24 * 7, // 7 days
      },
    }),
  );

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

  app.use(passport.initialize());
  app.use(passport.session());

  initializeSwagger(app);
  await app.listen(port);
}
bootstrap();
