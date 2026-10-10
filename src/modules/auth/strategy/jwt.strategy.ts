import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IJwtClaims } from '../interfaces/index.js';
import { SessionService } from '../services/index.js';
import { config } from '../../../config/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly sessions: SessionService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT.ACCESS_TOKEN_SECRET,
    });
  }

  // [user, authInfo]: the Session id reaches handlers via @CurrentSessionId()
  async validate(claims: IJwtClaims) {
    const user = await this.sessions.authenticate(claims);
    return [user, { sid: claims.sid }];
  }
}
