import { ApiProperty } from '@nestjs/swagger';
import { BodyStatsDto } from './body-stats.dto.js';
import { NotificationSettingsDto } from './notifications.dto.js';
import { PersonalInformationDto } from './personal-information.dto.js';
import { SocialProfilesDto } from './social-profiles.dto.js';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({
    description: 'The unconfirmed new address of a pending Email change',
    example: null,
    nullable: true,
  })
  pendingEmail: string | null;

  @ApiProperty({
    description: 'When the pending Email change expires',
    example: null,
    nullable: true,
  })
  pendingEmailExpiresAt: Date | null;

  @ApiProperty({
    description: 'False for a User who can only sign in with Google',
    example: true,
  })
  hasPassword: boolean;

  @ApiProperty({ type: () => PersonalInformationDto })
  personalInformation: PersonalInformationDto;

  @ApiProperty({ type: () => SocialProfilesDto })
  socialProfiles: SocialProfilesDto;

  @ApiProperty({ type: () => BodyStatsDto })
  bodyStats: BodyStatsDto;

  @ApiProperty({ type: () => NotificationSettingsDto })
  notificationSettings: NotificationSettingsDto;

  @ApiProperty({
    example: 'https://cdn.example.com/1/6f1c2d3e.webp',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ example: '2023-10-01T00:00:00.000Z' })
  createTimeStamp: Date;

  @ApiProperty({ example: '2023-10-01T00:00:00.000Z' })
  updateTimeStamp: Date;

  @ApiProperty({ example: null, nullable: true })
  deleteTimeStamp: Date | null;
}
