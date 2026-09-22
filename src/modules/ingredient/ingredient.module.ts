import { Ingredient } from './entities/index.js';
import { IngredientController } from './controller/index.js';
import { IngredientService } from './service/index.js';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ingredient]),
    UserModule,
    PassportModule.register({}),
  ],
  controllers: [IngredientController],
  providers: [IngredientService],
})
export class IngredientModule {}
