import {
  Body,
  ConflictException,
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
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { GoogleAuthGuard } from '../guard/index.js';
import { config } from '../../../config/index.js';
import { BearerToken, CurrentUser, Public } from '../decorators/index.js';
import { IAuthenticatedUser, ISocialProfile } from '../interfaces/index.js';
import { clearSessionCookies, setSessionCookies } from '../cookies/index.js';

// Credential endpoints: 10 requests per minute per IP
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly sessions: SessionService) {}

  @Post('signup')
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
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
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @HttpCode(HttpStatus.OK)
  async signin(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.sessions.signIn(dto);
    setSessionCookies(res, tokens);
    return user;
  }

  // @Public: authenticated by the refresh token, not an access token
  @Post('refresh')
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
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
  @Public()
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
  @Public()
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // Initiates Google OAuth2 login
  }

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Redirect()
  async googleLoginCallback(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.socialCallback(req.user, res);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: IAuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.sessions.changePassword(user.userId, user.sessionId, dto);
  }

  // A browser navigation: a known refusal lands on the frontend, not a JSON page
  private async socialCallback(profile: ISocialProfile | false, res: Response) {
    if (!profile) return { url: `${config.FRONTEND_URL}/?error=oauth-failed` };
    try {
      const { tokens } = await this.sessions.signInSocial(profile);
      setSessionCookies(res, tokens);
      return { url: `${config.FRONTEND_URL}/dashboard` };
    } catch (error) {
      if (error instanceof ConflictException)
        return { url: `${config.FRONTEND_URL}/?error=password-first` };
      throw error;
    }
  }
}
