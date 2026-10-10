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
import { ProfileService } from '../service/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { IAuthenticatedUser } from '../../auth/interfaces/index.js';
import { ProfilePatchDto, UserResponseDto } from '../dto/index.js';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() { userId }: IAuthenticatedUser) {
    return this.profiles.getProfile(userId);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(
    @CurrentUser() { userId }: IAuthenticatedUser,
    @Body() patch: ProfilePatchDto,
  ) {
    return this.profiles.updateProfile(userId, patch);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() { userId }: IAuthenticatedUser) {
    return this.profiles.deleteAccount(userId);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: UserResponseDto })
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() { userId }: IAuthenticatedUser,
  ) {
    return this.profiles.uploadAvatar(file, userId);
  }
}
