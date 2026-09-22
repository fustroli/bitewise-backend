import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import databaseConfig from './app.development.config.js';
import { IngredientModule } from './modules/ingredient/ingredient.module.js';
import { MealModule } from './modules/meal/meal.module.js';
import { config } from './config/index.js';
import { MealPlanModule } from './modules/meal-plan/meal-plan.module.js';
import { HealthModule } from './modules/health/health.module.js';

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
    HealthModule,
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
