import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ICurrentUser } from '../interfaces/index.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities/index.js';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
    config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('ACCESS_TOKEN_SECRET'),
    });
    //!For getting the token from request cookies
    // super({
    //   jwtFromRequest: ExtractJwt.fromExtractors([
    //     (request) => {
    //       let token = null;
    //       if (request && request.cookies) {
    //         token = request.cookies['accessToken'];
    //       }
    //       return token;
    //     },
    //   ]),
    //   secretOrKey: config.get('ACCESS_TOKEN_SECRET'),
    // });
  }

  async validate(payload: ICurrentUser) {
    const id = payload.sub;

    const user = await this.repository.findOne({
      where: { id },
    });

    delete user.hash;
    return user;
  }
}
