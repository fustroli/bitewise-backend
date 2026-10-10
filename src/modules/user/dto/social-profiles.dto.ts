import { IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

// In a patch: a missing field is unchanged, null clears it (@IsOptional allows both)
export class SocialProfilesDto {
  @ApiProperty({
    example: 'https://www.facebook.com/username',
    description: "URL to the user's Facebook profile",
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  facebook?: string | null;

  @ApiProperty({
    example: 'https://www.twitter.com/username',
    description: "URL to the user's Twitter profile",
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  twitter?: string | null;

  @ApiProperty({
    example: 'https://www.linkedin.com/in/username',
    description: "URL to the user's LinkedIn profile",
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  linkedin?: string | null;

  @ApiProperty({
    example: 'https://www.instagram.com/username',
    description: "URL to the user's Instagram profile",
    nullable: true,
    required: false,
  })
  @IsString()
  @IsOptional()
  instagram?: string | null;
}
