import { IsBoolean, IsEmail, IsOptional, ValidateIf } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// Present but null fails validation
const IfPresent = () => ValidateIf((_object, value) => value !== undefined);

export class NotificationSettingsDto {
  @ApiProperty({
    example: 'user@example.com',
    description:
      'The default email address for notifications; null means the sign-in email',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  defaultEmailAddress?: string | null;

  // The flags can't be cleared, only set
  @ApiProperty({
    example: true,
    description: 'Flag to receive communication emails',
    required: false,
  })
  @IfPresent()
  @IsBoolean()
  communicationEmail?: boolean;

  @ApiProperty({
    example: true,
    description: 'Flag to receive marketing emails',
    required: false,
  })
  @IfPresent()
  @IsBoolean()
  marketingEmail?: boolean;

  @ApiProperty({
    example: true,
    description: 'Flag to receive security emails',
    required: false,
  })
  @IfPresent()
  @IsBoolean()
  securityEmail?: boolean;
}
