import { GoogleStrategy, JwtStrategy } from './strategy/index.js';

import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controller/auth.controller.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtGuard } from './guard/index.js';
import { EmailVerificationToken, Session } from './entities/index.js';
import {
  EmailVerificationCleanupTask,
  SessionCleanupTask,
} from './tasks/index.js';
import {
  EmailVerificationService,
  PasswordResetService,
  SessionService,
} from './services/index.js';
import { MailModule } from '../mail/index.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/index.js';
import googleOauthConfig from './config/google-oauth.config.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, EmailVerificationToken]),
    PassportModule.register({}),
    JwtModule.register({}),
    ConfigModule.forFeature(googleOauthConfig),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    SessionService,
    SessionCleanupTask,
    EmailVerificationService,
    EmailVerificationCleanupTask,
    PasswordResetService,
    JwtStrategy,
    GoogleStrategy,
    // Every route needs an access token unless marked @Public()
    { provide: APP_GUARD, useClass: JwtGuard },
  ],
})
export class AuthModule {}
