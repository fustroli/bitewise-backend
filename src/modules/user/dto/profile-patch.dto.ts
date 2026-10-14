import { IsObject, ValidateIf, ValidateNested } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { BodyStatsDto } from './body-stats.dto.js';
import { PersonalInformationDto } from './personal-information.dto.js';
import { SocialProfilesDto } from './social-profiles.dto.js';
import { TargetsDto } from './targets.dto.js';
import { Type } from 'class-transformer';

// A group may be missing (unchanged) but not null
const IfPresent = () => ValidateIf((_object, value) => value !== undefined);

/** PATCH /users/me. A missing group or field is unchanged; a null field is cleared. */
export class ProfilePatchDto {
  @IfPresent()
  @IsObject()
  @ValidateNested()
  @Type(() => PersonalInformationDto)
  @ApiProperty({ type: PersonalInformationDto, required: false })
  personalInformation?: PersonalInformationDto;

  @IfPresent()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialProfilesDto)
  @ApiProperty({ type: SocialProfilesDto, required: false })
  socialProfiles?: SocialProfilesDto;

  @IfPresent()
  @IsObject()
  @ValidateNested()
  @Type(() => BodyStatsDto)
  @ApiProperty({ type: BodyStatsDto, required: false })
  bodyStats?: BodyStatsDto;

  @IfPresent()
  @IsObject()
  @ValidateNested()
  @Type(() => TargetsDto)
  @ApiProperty({ type: TargetsDto, required: false })
  targets?: TargetsDto;
}
