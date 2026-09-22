import { ApiProperty } from '@nestjs/swagger';
import { IngredientResponseDto } from './response-ingredient.dto.js';

export class PaginatedIngredientDto {
  @ApiProperty({ type: [IngredientResponseDto] })
  data: IngredientResponseDto[];

  @ApiProperty()
  count: number;
}
