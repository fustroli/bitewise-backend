import { ApiProperty } from '@nestjs/swagger';
import { EUnit } from '../enum/index.js';

// What a picker needs to offer an Ingredient
export class IngredientOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Apple' })
  name: string;

  @ApiProperty({ enum: EUnit, enumName: 'EUnit' })
  unit: EUnit;
}
