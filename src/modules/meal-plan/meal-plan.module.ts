import { MealPlan } from './entities/index.js';
import { MealPlanController } from './controller/index.js';
import { MealPlanService } from './service/index.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([MealPlan]), PassportModule.register({})],
  controllers: [MealPlanController],
  providers: [MealPlanService],
})
export class MealPlanModule {}
