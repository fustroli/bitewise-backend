import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { IsBiggerThanSaturatedFat } from '../decorator/index.js';
import { MAX_LENGTH, MIN_LENGTH } from '../../../utils/constants.js';
import { EUnit } from '../enum/index.js';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @Length(MIN_LENGTH, MAX_LENGTH, {
    message: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
  })
  @ApiProperty({ example: 'Apple', required: true })
  readonly name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 10,
    description: 'Amount of protein in grams',
    required: true,
  })
  readonly protein: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @IsBiggerThanSaturatedFat()
  @ApiProperty({
    example: 5,
    description: 'Total fat in grams',
    required: true,
  })
  readonly totalFat: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 2,
    description: 'Saturated fat in grams',
    required: true,
  })
  readonly saturatedFat: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 30,
    description: 'Total carbohydrates in grams',
    required: true,
  })
  readonly totalCarbohydrates: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 10,
    description: 'Sugar content in grams',
    required: true,
  })
  readonly sugar: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 5,
    description: 'Dietary fiber in grams',
    required: true,
  })
  readonly dietaryFiber: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 200,
    description: 'Calories content',
    required: true,
  })
  readonly calories: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @ApiProperty({
    example: 50,
    description: 'Price',
    required: true,
  })
  readonly price: number;

  @IsNotEmpty()
  @IsEnum(EUnit)
  @ApiProperty({ enum: EUnit, enumName: 'EUnit', required: true })
  readonly unit: EUnit;

  @IsNumber()
  @ApiProperty({ example: 1, required: true })
  readonly userId: number;
}
