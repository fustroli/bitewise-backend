import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../decorators/index.js';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'currentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'The new password for the user',
    example: 'NewPassword123!',
  })
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  password: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'NewPassword123!',
  })
  @IsNotEmpty()
  @IsString()
  @Match('password', { message: 'Confirm password must match password' })
  confirmPassword: string;
}
