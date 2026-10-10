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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProfileService } from '../service/index.js';
import { JwtGuard } from '../../auth/guard/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ProfilePatchDto, UserResponseDto } from '../dto/index.js';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller('users')
export class UserController {
  constructor(private readonly profiles: ProfileService) {}

  @Get('me')
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser('id') userId: number) {
    return this.profiles.getProfile(userId);
  }

  @Patch('me')
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(@CurrentUser('id') userId: number, @Body() patch: ProfilePatchDto) {
    return this.profiles.updateProfile(userId, patch);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser('id') userId: number) {
    return this.profiles.deleteAccount(userId);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: UserResponseDto })
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: number,
  ) {
    return this.profiles.uploadAvatar(file, userId);
  }
}
