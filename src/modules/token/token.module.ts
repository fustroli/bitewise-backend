import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../auth/strategy/index.js';
import { TokenService } from '../token/services/token.service.js';
import { UserService } from '../user/service/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([]), JwtModule.register({})],
  controllers: [],
  providers: [TokenService, JwtStrategy, UserService],
  exports: [TokenService],
})
export class TokenModule {}
