import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto, LoginUserDto, ChangePasswordDto } from '../dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import {
  FacebookAuthGuard,
  GoogleAuthGuard,
  JwtGuard,
  RefreshJwtGuard,
} from '../guard';
import { config } from 'src/config';
import { CurrentUser } from '../decorators';

@UseGuards(ThrottlerGuard)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: CreateUserDto, @Res() res: Response) {
    return this.authService.signUp(dto, res);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  @UseGuards(JwtGuard)
  signin(@Body() dto: LoginUserDto, @Res() res: Response) {
    return this.authService.signIn(dto, res);
  }

  @Post('refresh')
  @UseGuards(RefreshJwtGuard)
  refresh(@Req() req, @Res() res: Response) {
    return this.authService.refresh(req, res);
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // Initiates Google OAuth2 login
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleLoginCallback(@Req() req, @Res() res: Response) {
    const user = req.user;
    await this.authService.googleSignIn(user, res);
    res.redirect(`${config.FRONTEND_URL}/dashboard`);
  }

  @Get('facebook/login')
  @UseGuards(FacebookAuthGuard)
  async facebookLogin() {
    // Initiates Facebook OAuth2 login
  }

  @Get('facebook/callback')
  @UseGuards(FacebookAuthGuard)
  async facebookLoginCallback(@Req() req, @Res() res: Response) {
    const user = req.user;

    await this.authService.facebookSignIn(user, res);
    res.redirect(`${config.FRONTEND_URL}/dashboard?token=${req.accessToken}`);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser('sub') id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(dto, id);
  }

  @Get('session')
  async getAuthSession(@Session() session: Record<string, any>) {
    console.log(session);
    console.log(session.id);
    session.authenticated = true;
    return session;
  }
}
