import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
} from 'class-validator';
import { MAX_LENGTH, MIN_LENGTH } from '../../../utils/constants.js';

export class CreateMealPlanDto {
  @ApiProperty({
    description: 'The name of the meal plan',
    example: 'Breakfast Meal Plan',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Length(MIN_LENGTH, MAX_LENGTH, {
    message: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
  })
  name: string;

  @ApiProperty({
    description: 'Distinct ids of the Meals in the meal plan',
    type: [Number],
    required: true,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Meal plan must have at least one meal' })
  @ArrayUnique({ message: 'Each meal may appear only once in a meal plan' })
  @IsInt({ each: true })
  mealIds: number[];
}
