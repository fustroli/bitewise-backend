import { IsInt, Max, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EOrderDirection } from './enums/index.js';
import { ApiProperty } from '@nestjs/swagger';

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_LIMIT)
  @ApiProperty({
    example: 10,
    required: false,
    description: `Defaults to ${DEFAULT_PAGE_LIMIT}, max ${MAX_PAGE_LIMIT}`,
  })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 2, required: false })
  offset?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'name',
    required: false,
    description: 'Must be one of the resource’s sortable columns',
  })
  orderBy?: string;

  @IsOptional()
  @IsEnum(EOrderDirection)
  @ApiProperty({
    enum: EOrderDirection,
    enumName: 'EOrderDirection',
    required: false,
  })
  orderDirection?: EOrderDirection;
}
