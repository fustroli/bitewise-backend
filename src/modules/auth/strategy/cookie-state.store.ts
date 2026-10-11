import { randomBytes, timingSafeEqual } from 'node:crypto';
import { CookieOptions, Request } from 'express';
import { config } from '../../../config/index.js';
import parse from 'parse-duration';

const STATE_COOKIE = 'oauthState';
const STATE_TTL = parse('10m');
const STATE_BYTES = 32;

// Lax, not strict: the callback is a cross-site top-level navigation from the provider
function options(): CookieOptions {
  return {
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    httpOnly: true,
    path: '/api/auth/google',
  };
}

function matches(expected: unknown, provided: unknown) {
  if (typeof expected !== 'string' || typeof provided !== 'string')
    return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

// OAuth `state` bound to the browser (login CSRF) without express-session: a nonce in a
// short-lived cookie, checked against `?state=` on the callback and cleared either way.
// Not `implements StateStore`: its overloads (with/without `meta`) can't be satisfied by one
// signature, and passport-oauth2 dispatches on arity, so these must stay 2- and 3-ary
export class CookieStateStore {
  store(req: Request, callback: (err: Error | null, state: string) => void) {
    const state = randomBytes(STATE_BYTES).toString('base64url');
    req.res!.cookie(STATE_COOKIE, state, {
      ...options(),
      maxAge: STATE_TTL,
    });
    callback(null, state);
  }

  verify(
    req: Request,
    providedState: string,
    callback: (err: Error | null, ok: boolean, info?: object) => void,
  ) {
    const expected = req.cookies?.[STATE_COOKIE];
    req.res!.clearCookie(STATE_COOKIE, options());

    if (!matches(expected, providedState))
      return callback(null, false, {
        message: 'Invalid authorization request state',
      });
    callback(null, true);
  }
}
