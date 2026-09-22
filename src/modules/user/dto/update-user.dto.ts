import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateUserDto } from '../../auth/dto/index.js';
import { NotificationSettingsDto } from './notifications.dto.js';
import { PersonalInformationDto } from './personal-information.dto.js';
import { SocialProfilesDto } from './social-profiles.dto.js';
import { Type } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  readonly refreshToken?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Google ID of the user' })
  readonly googleId?: string;

  @IsString()
  @IsOptional()
  hash?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInformationDto)
  @ApiProperty({ type: PersonalInformationDto })
  personalInformation?: PersonalInformationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialProfilesDto)
  @ApiProperty({ type: SocialProfilesDto })
  socialProfiles?: SocialProfilesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @ApiProperty({ type: NotificationSettingsDto })
  notificationSettings?: NotificationSettingsDto;
}
