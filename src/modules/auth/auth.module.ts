import { FacebookStrategy, GoogleStrategy, JwtStrategy } from './strategy';

import { AuthController } from './controller/auth.controller';
import { AuthService } from './services';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { SessionSerializer } from './serializers';
import { TokenService } from '../token/services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/user/entities';
import { UserModule } from '../user/user.module';
import facebookOauthConfig from './config/facebook-oauth.config';
import googleOauthConfig from './config/google-oauth.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
    SessionSerializer,
  ],
  exports: [AuthService],
})
export class AuthModule {}
