import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import databaseConfig from './app.development.config';
import { IngredientModule } from './modules/ingredient/ingredient.module';
import { MealModule } from './modules/meal/meal.module';
import { config } from './config';
import { MealPlanModule } from './modules/meal-plan/meal-plan.module';
import { HealthModule } from './modules/health/health.module';

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
