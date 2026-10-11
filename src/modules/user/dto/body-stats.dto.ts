import { IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import {
  HEIGHT_CM_MAX,
  HEIGHT_CM_MIN,
  HIP_CM_MAX,
  HIP_CM_MIN,
  MEASUREMENT_CM_STEP,
  NECK_CM_MAX,
  NECK_CM_MIN,
  WAIST_CM_MAX,
  WAIST_CM_MIN,
  WEIGHT_KG_MAX,
  WEIGHT_KG_MIN,
} from '../constants/index.js';
import { IsMultipleOf } from '../decorators/index.js';
import { EActivityLevel, ESex } from '../enum/index.js';

// In a patch: a missing field is unchanged, null clears it (@IsOptional allows both)
export class BodyStatsDto {
  @ApiProperty({
    enum: ESex,
    example: ESex.FEMALE,
    nullable: true,
    required: false,
  })
  @IsEnum(ESex)
  @IsOptional()
  sex?: ESex | null;

  @ApiProperty({
    description: 'Height in cm',
    example: 175,
    minimum: HEIGHT_CM_MIN,
    maximum: HEIGHT_CM_MAX,
    nullable: true,
    required: false,
  })
  @IsInt()
  @Min(HEIGHT_CM_MIN)
  @Max(HEIGHT_CM_MAX)
  @IsOptional()
  heightCm?: number | null;

  @ApiProperty({
    description: 'Weight in kg, at most one decimal',
    example: 72.5,
    minimum: WEIGHT_KG_MIN,
    maximum: WEIGHT_KG_MAX,
    nullable: true,
    required: false,
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(WEIGHT_KG_MIN)
  @Max(WEIGHT_KG_MAX)
  @IsOptional()
  weightKg?: number | null;

  @ApiProperty({
    enum: EActivityLevel,
    example: EActivityLevel.MODERATE,
    nullable: true,
    required: false,
  })
  @IsEnum(EActivityLevel)
  @IsOptional()
  activityLevel?: EActivityLevel | null;

  @ApiProperty({
    description: 'Neck circumference in cm, in 0.5 cm steps',
    example: 37.5,
    minimum: NECK_CM_MIN,
    maximum: NECK_CM_MAX,
    multipleOf: MEASUREMENT_CM_STEP,
    nullable: true,
    required: false,
  })
  @IsNumber()
  @IsMultipleOf(MEASUREMENT_CM_STEP)
  @Min(NECK_CM_MIN)
  @Max(NECK_CM_MAX)
  @IsOptional()
  neckCm?: number | null;

  @ApiProperty({
    description: 'Waist circumference in cm, in 0.5 cm steps',
    example: 84,
    minimum: WAIST_CM_MIN,
    maximum: WAIST_CM_MAX,
    multipleOf: MEASUREMENT_CM_STEP,
    nullable: true,
    required: false,
  })
  @IsNumber()
  @IsMultipleOf(MEASUREMENT_CM_STEP)
  @Min(WAIST_CM_MIN)
  @Max(WAIST_CM_MAX)
  @IsOptional()
  waistCm?: number | null;

  @ApiProperty({
    description: 'Hip circumference in cm, in 0.5 cm steps (used for women)',
    example: 98.5,
    minimum: HIP_CM_MIN,
    maximum: HIP_CM_MAX,
    multipleOf: MEASUREMENT_CM_STEP,
    nullable: true,
    required: false,
  })
  @IsNumber()
  @IsMultipleOf(MEASUREMENT_CM_STEP)
  @Min(HIP_CM_MIN)
  @Max(HIP_CM_MAX)
  @IsOptional()
  hipCm?: number | null;
}
