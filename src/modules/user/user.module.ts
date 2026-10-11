import { Module } from '@nestjs/common';
import { ProfileService, StatisticsService } from './service/index.js';
import { StorageService } from '../storage/storage.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/index.js';
import { UserController } from './controller/index.js';
import { Ingredient } from '../ingredient/entities/index.js';
import { Meal } from '../meal/entities/index.js';
import { MealPlan } from '../meal-plan/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ingredient, Meal, MealPlan])],
  controllers: [UserController],
  providers: [ProfileService, StatisticsService, StorageService],
})
export class UserModule {}
