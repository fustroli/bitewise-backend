import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from '../services/index.js';
import { Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import facebookOAuth from '../config/facebook-oauth.config.js';
import { VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(facebookOAuth.KEY)
    private readonly facebookConfiguration: ConfigType<typeof facebookOAuth>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: facebookConfiguration.clientId,
      clientSecret: facebookConfiguration.clientSecret,
      callbackURL: facebookConfiguration.callbackURL,
      profileFields: ['id', 'emails', 'name'],
      scope: ['email', 'public_profile'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, id } = profile;
    const user = {
      email: emails[0].value,
      facebookId: id,
    };

    done(null, user);
  }
}
