import { ApiProperty } from '@nestjs/swagger';
import { EUnit } from '../enum/index.js';

export class IngredientResponseDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the ingredient',
  })
  id: number;

  @ApiProperty({ example: 'Apple', description: 'Name of the ingredient' })
  name: string;

  @ApiProperty({ example: 0.3, description: 'Amount of protein in grams' })
  protein: number;

  @ApiProperty({ example: 0.2, description: 'Total fat in grams' })
  totalFat: number;

  @ApiProperty({ example: 0.1, description: 'Saturated fat in grams' })
  saturatedFat: number;

  @ApiProperty({ example: 14, description: 'Total carbohydrates in grams' })
  totalCarbohydrates: number;

  @ApiProperty({ example: 10, description: 'Sugar content in grams' })
  sugar: number;

  @ApiProperty({ example: 2.4, description: 'Dietary fiber in grams' })
  dietaryFiber: number;

  @ApiProperty({ example: 52, description: 'Calories content' })
  calories: number;

  @ApiProperty({ example: 50, description: 'Price' })
  price: number;

  @ApiProperty({ enum: EUnit, enumName: 'EUnit' })
  unit: EUnit;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: '2023-10-01T00:00:00.000Z' })
  createTimeStamp: Date;

  @ApiProperty({ example: '2023-10-01T00:00:00.000Z' })
  updateTimeStamp: Date;

  @ApiProperty({ example: null, nullable: true })
  deleteTimeStamp: Date | null;
}
