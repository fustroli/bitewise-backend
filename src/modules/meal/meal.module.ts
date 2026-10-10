import { Meal } from './entities/index.js';
import { MealController } from './controller/index.js';
import { MealService } from './service/index.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Meal]), PassportModule.register({})],
  controllers: [MealController],
  providers: [MealService],
})
export class MealModule {}
