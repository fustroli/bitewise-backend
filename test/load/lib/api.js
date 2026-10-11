import http from 'k6/http';
import { BASE_URL } from './config.js';

// Each User gets its own client IP, so the per-IP throttler sees N clients, not one.
// Needs TRUST_PROXY_HOPS >= 1 on the app (see README).
export function clientIp(n) {
  return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
}

/**
 * One API call as User n.
 * @param tags `name` groups URLs with ids; `phase` is setup | run; `kind` is read | write
 */
export function call(method, path, { n, token, body, tags }) {
  const headers = { 'X-Forwarded-For': clientIp(n) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return http.request(
    method,
    `${BASE_URL}${path}`,
    body === undefined ? null : JSON.stringify(body),
    {
      headers,
      tags,
      responseCallback: http.expectedStatuses({ min: 200, max: 399 }),
    },
  );
}

// Tokens arrive only as Set-Cookie (accepted back only as Bearer)
export function tokensOf(res) {
  const cookie = (name) => res.cookies[name]?.[0]?.value;
  return {
    accessToken: cookie('accessToken'),
    refreshToken: cookie('refreshToken'),
  };
}
