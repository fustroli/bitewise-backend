import { ApiProperty } from '@nestjs/swagger';
import { NormalizeEmail } from '../../../common/decorators/index.js';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'email@bitewise.com', required: true })
  @NormalizeEmail()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPassword1', required: true })
  readonly password: string;
}
