import { ApiProperty } from '@nestjs/swagger';
import { MealIngredientResponseDto } from './response-meal-ingredient.dto.js';

export class MealResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the meal',
  })
  id: number;

  @ApiProperty({ example: 'Fruit Salad', description: 'Name of the meal' })
  name: string;

  @ApiProperty({ type: [MealIngredientResponseDto] })
  mealIngredients: MealIngredientResponseDto[];
}
