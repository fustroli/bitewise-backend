import { Ingredient } from '../ingredient/entities/index.js';
import { MealModule } from '../meal/meal.module.js';
import { MealPlan } from './entities/index.js';
import { MealPlanController } from './controller/index.js';
import { MealPlanService } from './service/index.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([MealPlan, Ingredient]),
    MealModule,
    UserModule,
    PassportModule.register({}),
  ],
  controllers: [MealPlanController],
  providers: [MealPlanService],
})
export class MealPlanModule {}
