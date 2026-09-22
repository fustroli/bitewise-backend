import { ApiProperty } from '@nestjs/swagger';
import { MealResponseDto } from './response-meal.dto.js';

export class PaginatedMealResponseDto {
  @ApiProperty({ type: [MealResponseDto] })
  data: MealResponseDto[];

  @ApiProperty()
  count: number;
}
