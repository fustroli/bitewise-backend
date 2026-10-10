import {
  FacebookStrategy,
  GoogleStrategy,
  JwtStrategy,
} from './strategy/index.js';

import { AuthController } from './controller/auth.controller.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { Session } from './entities/index.js';
import { SessionService } from './services/index.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/index.js';
import facebookOauthConfig from './config/facebook-oauth.config.js';
import googleOauthConfig from './config/google-oauth.config.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    PassportModule.register({}),
    JwtModule.register({}),
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(facebookOauthConfig),
  ],
  controllers: [AuthController],
  providers: [SessionService, JwtStrategy, GoogleStrategy, FacebookStrategy],
})
export class AuthModule {}
