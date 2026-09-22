import { IsInt, Min, IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EOrderDirection } from './enums/index.js';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 10 })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @ApiProperty({ example: 2 })
  offset?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'name' })
  orderBy?: string;

  @IsOptional()
  @IsEnum(EOrderDirection)
  @ApiProperty({ type: EOrderDirection, enumName: 'EOrderDirection' })
  orderDirection?: EOrderDirection;
}
