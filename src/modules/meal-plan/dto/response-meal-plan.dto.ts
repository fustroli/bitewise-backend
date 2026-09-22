import { ApiProperty } from '@nestjs/swagger';
import { MealResponseDto } from '../../meal/dto/index.js';

export class MealPlanResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the meal plan',
  })
  id: number;

  @ApiProperty({
    example: 'Breakfast Meal Plan',
    description: 'Name of the meal plan',
  })
  name: string;

  @ApiProperty({
    description: 'Array of meals associated with the meal plan',
    type: [MealResponseDto],
  })
  meals: MealResponseDto[];
}
