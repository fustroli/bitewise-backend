import { CookieOptions, Response } from 'express';
import { ISessionTokens } from '../services/index.js';
import { config } from '../../../config/index.js';
import parse from 'parse-duration';

// Issued as cookies, but only ever accepted as `Bearer` (the Next server forwards them)
const ACCESS_TOKEN = 'accessToken';
const REFRESH_TOKEN = 'refreshToken';

// Lax, not strict: after the Google OAuth redirect chain the browser withholds strict cookies
// from the landing request on the frontend, so the proxy sees no token
function options(): CookieOptions {
  return {
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
    ...(config.COOKIE_DOMAIN ? { domain: config.COOKIE_DOMAIN } : {}),
  };
}

export function setSessionCookies(res: Response, tokens: ISessionTokens) {
  res.cookie(ACCESS_TOKEN, tokens.accessToken, {
    ...options(),
    maxAge: parse(config.JWT.ACCESS_TOKEN_EXPIRATION),
  });
  res.cookie(REFRESH_TOKEN, tokens.refreshToken, {
    ...options(),
    maxAge: parse(config.JWT.REFRESH_TOKEN_EXPIRATION),
  });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN, options());
  res.clearCookie(REFRESH_TOKEN, options());
}
