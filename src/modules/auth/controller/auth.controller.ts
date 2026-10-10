import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Redirect,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  CreateUserDto,
  LoginUserDto,
  ChangePasswordDto,
} from '../dto/index.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionService } from '../services/index.js';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import {
  FacebookAuthGuard,
  GoogleAuthGuard,
  JwtGuard,
} from '../guard/index.js';
import { config } from '../../../config/index.js';
import {
  BearerToken,
  CurrentSessionId,
  CurrentUser,
} from '../decorators/index.js';
import { clearSessionCookies, setSessionCookies } from '../cookies/index.js';

@UseGuards(ThrottlerGuard)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly sessions: SessionService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.sessions.signUp(dto);
    setSessionCookies(res, tokens);
    return user;
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.sessions.signIn(dto);
    setSessionCookies(res, tokens);
    return user;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async refresh(
    @BearerToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.sessions.rotate(refreshToken);
    setSessionCookies(res, tokens);
    return user;
  }

  @Post('signout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async signout(
    @BearerToken() refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { sid } = await this.sessions.verifyRefreshToken(refreshToken);
    await this.sessions.signOut(sid);
    clearSessionCookies(res);
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // Initiates Google OAuth2 login
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  async googleLoginCallback(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens } = await this.sessions.signInSocial(req.user);
    setSessionCookies(res, tokens);
    return { url: `${config.FRONTEND_URL}/dashboard` };
  }

  @Get('facebook/login')
  @UseGuards(FacebookAuthGuard)
  async facebookLogin() {
    // Initiates Facebook OAuth2 login
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  @Redirect()
  async facebookLoginCallback(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { tokens } = await this.sessions.signInSocial(req.user);
    setSessionCookies(res, tokens);
    return { url: `${config.FRONTEND_URL}/dashboard` };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  changePassword(
    @CurrentUser('id') userId: number,
    @CurrentSessionId() sid: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.sessions.changePassword(userId, sid, dto);
  }
}
