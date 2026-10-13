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
  ConfirmPasswordResetDto,
  RequestPasswordResetDto,
  VerifyEmailDto,
} from '../dto/index.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  EmailVerificationService,
  PasswordResetService,
  SessionService,
} from '../services/index.js';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { GoogleAuthGuard } from '../guard/index.js';
import { config } from '../../../config/index.js';
import { BearerToken, CurrentUser, Public } from '../decorators/index.js';
import { IAuthenticatedUser, ISocialProfile } from '../interfaces/index.js';
import { clearSessionCookies, setSessionCookies } from '../cookies/index.js';

// Credential endpoints: 10 requests per minute per IP
const CREDENTIAL_LIMIT = { default: { limit: 10, ttl: 60_000 } };
// Each one sends an email: 3 per 15 minutes per IP
const RESEND_LIMIT = { default: { limit: 3, ttl: 900_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly sessions: SessionService,
    private readonly verification: EmailVerificationService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('signup')
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.sessions.signUp(dto);
    await this.verification.send(user);
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

  // Always clears the cookies: a missing, expired or bad token still signs out
  @Post('signout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async signout(
    @BearerToken({ optional: true }) refreshToken: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    clearSessionCookies(res);
    await this.sessions.signOut(refreshToken);
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

  // @Public: the link may be opened signed out, or on another device
  @Post('verify-email')
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verification.verify(dto.token);
  }

  @Post('resend-verification')
  @Throttle(RESEND_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  resendVerification(@CurrentUser() user: IAuthenticatedUser) {
    return this.verification.resend(user.userId);
  }

  // Always 204, so the response never tells whether the email has an account
  @Post('password-reset')
  @Public()
  @Throttle(RESEND_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.passwordReset.request(dto.email);
  }

  // No auto sign-in: every Session ends, the frontend sends the User to sign in
  @Post('password-reset/confirm')
  @Public()
  @Throttle(CREDENTIAL_LIMIT)
  @HttpCode(HttpStatus.NO_CONTENT)
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto) {
    return this.passwordReset.confirm(dto.token, dto.password);
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
