import { IsEnum, IsOptional } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { ECalorieTarget, EMacroPlan } from '../enum/index.js';

// In a patch: a missing field is unchanged, null clears it (@IsOptional allows both)
export class TargetsDto {
  @ApiProperty({
    enum: ECalorieTarget,
    enumName: 'ECalorieTarget',
    example: ECalorieTarget.LOSE_NORMAL,
    description:
      'Daily calorie goal relative to Maintenance (mild/normal/fast = 0.25/0.5/1 kg per week); null means maintenance',
    nullable: true,
    required: false,
  })
  @IsEnum(ECalorieTarget)
  @IsOptional()
  calorieTarget?: ECalorieTarget | null;

  @ApiProperty({
    enum: EMacroPlan,
    enumName: 'EMacroPlan',
    example: EMacroPlan.HIGH_PROTEIN,
    description: 'Macro split; null means balanced',
    nullable: true,
    required: false,
  })
  @IsEnum(EMacroPlan)
  @IsOptional()
  macroPlan?: EMacroPlan | null;
}
