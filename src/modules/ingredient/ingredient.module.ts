import { Ingredient } from './entities/index.js';
import { IngredientController } from './controller/index.js';
import { IngredientService } from './service/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Ingredient])],
  controllers: [IngredientController],
  providers: [IngredientService],
})
export class IngredientModule {}
