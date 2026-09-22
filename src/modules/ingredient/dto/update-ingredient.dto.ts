import { PartialType } from '@nestjs/mapped-types';
import { CreateIngredientDto } from './create-ingredient.dto.js';

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}
