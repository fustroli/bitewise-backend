import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'email@bitewise.com', required: true })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'StrongPassword1', required: true })
  readonly password: string;
}
