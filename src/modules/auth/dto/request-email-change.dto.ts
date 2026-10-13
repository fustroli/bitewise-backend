import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { NormalizeEmail } from '../../../common/decorators/index.js';

export class RequestEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'new-email@bitewise.com', required: true })
  @NormalizeEmail()
  readonly newEmail: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The current password', required: true })
  readonly password: string;
}
