import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../decorators/index.js';
import { PASSWORD_MIN_LENGTH } from '../constants/index.js';

// Issued tokens are 43 characters; anything far longer isn't one
const TOKEN_MAX_LENGTH = 128;

export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(TOKEN_MAX_LENGTH)
  @ApiProperty({ description: 'The token from the reset link' })
  readonly token: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: PASSWORD_MIN_LENGTH,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @ApiProperty({ example: 'StrongPassword1!', required: true })
  readonly password: string;

  @IsString()
  @IsNotEmpty()
  @Match<ConfirmPasswordResetDto>('password', {
    message: 'Passwords do not match',
  })
  @ApiProperty({ example: 'StrongPassword1!', required: true })
  readonly passwordConfirm: string;
}
