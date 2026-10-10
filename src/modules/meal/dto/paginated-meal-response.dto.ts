import { ApiProperty } from '@nestjs/swagger';
import { IPaginated } from '../../../common/pagination/index.js';
import { MealResponseDto } from './response-meal.dto.js';

// Swagger can't describe the generic IPaginated<T>, so each resource keeps a thin class.
export class PaginatedMealResponseDto implements IPaginated<MealResponseDto> {
  @ApiProperty({ type: [MealResponseDto] })
  data: MealResponseDto[];

  @ApiProperty()
  count: number;
}
