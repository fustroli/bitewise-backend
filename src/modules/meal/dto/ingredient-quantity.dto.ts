import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsNotEmpty, IsPositive, Max } from 'class-validator';
import { QUANTITY_MAX } from '../../../utils/constants.js';

export class IngredientQuantityDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({
    example: 1,
    description: 'ID of the ingredient',
    required: true,
  })
  readonly ingredientId: number;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  @Max(QUANTITY_MAX)
  @ApiProperty({
    example: 100,
    description: 'Quantity of the ingredient in the meal',
    maximum: QUANTITY_MAX,
    required: true,
  })
  readonly quantity: number;
}
