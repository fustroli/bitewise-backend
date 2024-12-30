import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { MealModule } from './modules/meal/meal.module';
import { MealPlanModule } from './modules/meal-plan/meal-plan.module';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from 'src/modules/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './modules/user/user.module';
import { config } from './config';
import databaseConfig from './app.development.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRoot(databaseConfig),
    ThrottlerModule.forRoot([
      {
        ttl: config.THROTTLER.TTL,
        limit: config.THROTTLER.LIMIT,
      },
    ]),
    AuthModule,
    UserModule,
    IngredientModule,
    MealModule,
    MealPlanModule,
    PassportModule.register({ session: true }),
    RedisModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
