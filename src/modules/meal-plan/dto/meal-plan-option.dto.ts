import { ApiProperty } from '@nestjs/swagger';

// What a picker needs to offer a Meal plan, and to load its Meals
export class MealPlanOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cutting week' })
  name: string;

  @ApiProperty({
    example: [1],
    description: 'The Meal plan’s Meals, in its order',
  })
  mealIds: number[];
}
