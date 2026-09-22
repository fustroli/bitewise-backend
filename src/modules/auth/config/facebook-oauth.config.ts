import { registerAs } from '@nestjs/config';
import { config } from '../../../config/index.js';

export default registerAs('facebookOAuth', () => ({
  clientId: config.FACEBOOK.FACEBOOK_CLIENT_ID,
  clientSecret: config.FACEBOOK.FACEBOOK_SECRET,
  callbackURL: config.FACEBOOK.FACEBOOK_CALLBACK_URL,
}));
