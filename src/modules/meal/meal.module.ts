import { Ingredient } from '../ingredient/entities/index.js';
import { Meal } from './entities/index.js';
import { MealController } from './controller/index.js';
import { MealIngredient } from './entities/index.js';
import { MealService } from './service/index.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, MealIngredient, Ingredient]),
    UserModule,
    PassportModule.register({}),
  ],
  controllers: [MealController],
  providers: [MealService],
  exports: [MealService],
})
export class MealModule {}
