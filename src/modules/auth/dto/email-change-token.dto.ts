import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// Issued tokens are 43 characters; anything far longer isn't one
const TOKEN_MAX_LENGTH = 128;

export class EmailChangeTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(TOKEN_MAX_LENGTH)
  @ApiProperty({ description: 'The token from the email change link' })
  readonly token: string;
}
