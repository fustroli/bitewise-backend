import { ApiProperty } from '@nestjs/swagger';
import { IPaginated } from '../../../common/pagination/index.js';
import { IngredientResponseDto } from './response-ingredient.dto.js';

// Swagger can't describe the generic IPaginated<T>, so each resource keeps a thin class.
export class PaginatedIngredientDto implements IPaginated<IngredientResponseDto> {
  @ApiProperty({ type: [IngredientResponseDto] })
  data: IngredientResponseDto[];

  @ApiProperty()
  count: number;
}
