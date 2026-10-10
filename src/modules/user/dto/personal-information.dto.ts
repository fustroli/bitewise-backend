import { IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

// In a patch: a missing field is unchanged, null clears it (@IsOptional allows both)
export class PersonalInformationDto {
  @ApiProperty({
    description: 'Username of the user',
    example: 'john_doe',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  userName?: string | null;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string | null;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string | null;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @ApiProperty({
    description: 'Date of birth of the user',
    type: String,
    example: '1990-01-01',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? new Date(value).toISOString().split('T')[0] : value,
  )
  dateOfBirth?: string | null;
}
