import { ApiProperty } from '@nestjs/swagger';
import { IPaginated } from '../../../common/pagination/index.js';
import { MealPlanResponseDto } from './response-meal-plan.dto.js';

// Swagger can't describe the generic IPaginated<T>, so each resource keeps a thin class.
export class PaginatedMealPlanResponseDto implements IPaginated<MealPlanResponseDto> {
  @ApiProperty({ type: [MealPlanResponseDto] })
  data: MealPlanResponseDto[];

  @ApiProperty()
  count: number;
}
