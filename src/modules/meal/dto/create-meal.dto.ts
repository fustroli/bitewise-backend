import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { MAX_LENGTH, MIN_LENGTH } from '../../../utils/constants.js';
import { Type } from 'class-transformer';
import { IngredientQuantityDto } from './ingredient-quantity.dto.js';

export class CreateMealDto {
  @IsString()
  @IsNotEmpty()
  @Length(MIN_LENGTH, MAX_LENGTH, {
    message: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
  })
  @ApiProperty({ example: 'Fruit Salad', required: true })
  readonly name: string;

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Meal must have at least one ingredient',
  })
  @ArrayUnique((item: IngredientQuantityDto) => item?.ingredientId, {
    message: 'Each ingredient may appear only once in a meal',
  })
  @ValidateNested({ each: true })
  @Type(() => IngredientQuantityDto)
  @ApiProperty({
    type: [IngredientQuantityDto],
    description: 'Array of ingredients with quantities',
    required: true,
  })
  readonly mealIngredients: IngredientQuantityDto[];
}
