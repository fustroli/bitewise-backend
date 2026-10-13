import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProfileService, StatisticsService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { IAuthenticatedUser } from '../../auth/interfaces/index.js';
import {
  ProfilePatchDto,
  StatisticsResponseDto,
  UserResponseDto,
} from '../dto/index.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { AVATAR_MAX_BYTES } from '../avatar/index.js';
import { toUserResponse, TUserResponse } from '../serializers/index.js';
import { User } from '../entities/index.js';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly profiles: ProfileService,
    private readonly statistics: StatisticsService,
  ) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() { userId }: IAuthenticatedUser) {
    return this.profiles.getProfile(userId).then((u) => this.respond(u));
  }

  @Get('me/statistics')
  @ApiOkResponse({ type: StatisticsResponseDto })
  getStatistics(@CurrentUser() { userId }: IAuthenticatedUser) {
    return this.statistics.getStatistics(userId);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(
    @CurrentUser() { userId }: IAuthenticatedUser,
    @Body() patch: ProfilePatchDto,
  ) {
    return this.profiles
      .updateProfile(userId, patch)
      .then((u) => this.respond(u));
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() { userId }: IAuthenticatedUser) {
    return this.profiles.deleteAccount(userId);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: AVATAR_MAX_BYTES } }),
  )
  @ApiOkResponse({ type: UserResponseDto })
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() { userId }: IAuthenticatedUser,
  ) {
    return this.profiles
      .uploadAvatar(file, userId)
      .then((u) => this.respond(u));
  }

  private async respond(user: User): Promise<TUserResponse> {
    return toUserResponse(
      user,
      await this.profiles.getPendingEmailChange(user.id),
    );
  }
}
