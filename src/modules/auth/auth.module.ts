import {
  FacebookStrategy,
  GoogleStrategy,
  JwtStrategy,
} from './strategy/index.js';

import { AuthController } from './controller/auth.controller.js';
import { AuthService } from './services/index.js';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from '../token/services/index.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/index.js';
import { UserModule } from '../user/user.module.js';
import facebookOauthConfig from './config/facebook-oauth.config.js';
import googleOauthConfig from './config/google-oauth.config.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({}),
    JwtModule.register({}),
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(facebookOauthConfig),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    TokenService,
    GoogleStrategy,
    FacebookStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
