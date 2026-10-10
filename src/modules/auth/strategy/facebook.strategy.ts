import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import facebookOAuth from '../config/facebook-oauth.config.js';
import { ISocialProfile } from '../interfaces/index.js';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(facebookOAuth.KEY)
    facebookConfiguration: ConfigType<typeof facebookOAuth>,
  ) {
    super({
      clientID: facebookConfiguration.clientId,
      clientSecret: facebookConfiguration.clientSecret,
      callbackURL: facebookConfiguration.callbackURL,
      profileFields: ['id', 'emails', 'name'],
      scope: ['email', 'public_profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): ISocialProfile {
    const email = profile.emails?.[0]?.value;
    if (!email)
      throw new UnauthorizedException('No email on the Facebook account');

    // Facebook only returns confirmed emails
    return {
      provider: 'facebook',
      providerId: profile.id,
      email,
      emailVerified: true,
    };
  }
}
