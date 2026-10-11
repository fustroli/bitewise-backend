import { ApiProperty } from '@nestjs/swagger';

export class StatisticsResponseDto {
  @ApiProperty({ example: 12 })
  ingredients: number;

  @ApiProperty({ example: 7 })
  meals: number;

  @ApiProperty({ example: 3 })
  mealPlans: number;
}
