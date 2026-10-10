import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthenticatedUser, IJwtClaims } from '../interfaces/index.js';
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

  validate(claims: IJwtClaims): Promise<IAuthenticatedUser> {
    return this.sessions.authenticate(claims);
  }
}
