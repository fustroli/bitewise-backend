import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'The name of the meal plan',
    example: 'Breakfast Meal Plan',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Array of meal IDs to be associated with the meal plan',
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  mealIds: number[];
}
