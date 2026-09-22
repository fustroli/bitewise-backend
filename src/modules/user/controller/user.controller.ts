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
import { UserService } from '../service/index.js';
import { JwtGuard } from '../../auth/guard/index.js';
import { CurrentUser } from '../../auth/decorators/index.js';
import { User } from '../entities/index.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UpdateUserDto, UserResponseDto } from '../dto/index.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserInterceptor } from '../interceptors/index.js';

@ApiTags('users')
@UseGuards(JwtGuard, ThrottlerGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  @UseInterceptors(UserInterceptor)
  @ApiOkResponse({ type: UserResponseDto })
  async getMe(@CurrentUser() currentUser: User): Promise<UserResponseDto> {
    return currentUser;
  }

  @Patch('me')
  @UseInterceptors(UserInterceptor)
  @ApiOkResponse({ type: UserResponseDto })
  async updateMe(
    @CurrentUser() currentUser: User,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(currentUser.id, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMe(@CurrentUser() user: User) {
    return this.userService.deleteOne(user.id);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOkResponse({ type: UserResponseDto })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return await this.userService.uploadAvatar(file, user.id);
  }
}
