import { ApiProperty } from '@nestjs/swagger';

// What a picker needs to offer a Meal
export class MealOptionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Oatmeal' })
  name: string;
}
