import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config.js';
import { ISocialProfile } from '../interfaces/index.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    googleConfiguration: ConfigType<typeof googleOauthConfig>,
  ) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.callbackURL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): ISocialProfile {
    const email = profile.emails?.[0];
    if (!email)
      throw new UnauthorizedException('No email on the Google account');

    return {
      provider: 'google',
      providerId: profile.id,
      email: email.value,
      emailVerified: email.verified === true,
    };
  }
}
