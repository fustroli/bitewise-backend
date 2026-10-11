import { HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { DestinationStream, Level, LevelWithSilent } from 'pino';
import { config } from '../../config/index.js';
import { resolveRequestId } from './request-id.js';

const SYNTHETIC_ERROR = /^failed with status code/;

const SECRET_KEYS = [
  'password',
  'oldPassword',
  'confirmPassword',
  'hash',
  'accessToken',
  'refreshToken',
  'refreshTokenHash',
  'tokens',
  'token',
];

// the access log carries no headers or bodies; this covers anything else logged
export const REDACTED_PATHS = [
  ...['req.headers', 'res.headers', 'headers'].flatMap((headers) => [
    `${headers}.authorization`,
    `${headers}.cookie`,
    `${headers}["set-cookie"]`,
  ]),
  ...SECRET_KEYS.flatMap((key) => [key, `*.${key}`]),
];

interface ISerializedReq {
  id: string;
  method: string;
  url: string;
  raw: Request;
}

const isHealthCheck = (req: IncomingMessage) =>
  (req as Request).originalUrl?.startsWith('/api/health') ?? false;

/**
 * LoggerModule params: JSON lines (pretty in development), one access log line per
 * request carrying reqId + userId, secrets redacted. `stream` is for tests.
 */
export function loggerParams({
  level = config.LOG_LEVEL,
  stream,
}: { level?: LevelWithSilent; stream?: DestinationStream } = {}): Params {
  const pretty = !stream && config.NODE_ENV === 'development';

  return {
    pinoHttp: [
      {
        level,
        // pino-pretty is a devDependency: only ever loaded in development
        transport: pretty
          ? { target: 'pino-pretty', options: { singleLine: true } }
          : undefined,
        redact: { paths: REDACTED_PATHS, censor: '[Redacted]' },
        genReqId: resolveRequestId,
        // in-request lines get reqId only; the access log line gets req/res too
        quietReqLogger: true,
        serializers: {
          // path only: query strings can carry OAuth codes
          req: ({ id, method, url, raw }: ISerializedReq) => ({
            id,
            method,
            path: url.split('?')[0],
            ip: raw.ip,
            userAgent: raw.headers['user-agent'],
          }),
          res: (res: { statusCode: number }) => ({
            statusCode: res.statusCode,
          }),
        },
        // evaluated again when the response finishes, after JwtGuard set req.user
        customProps: (req: IncomingMessage) => ({
          userId: (req as Request).user?.userId,
        }),
        customLogLevel: (
          req: IncomingMessage,
          res: ServerResponse,
          err?: Error,
        ): Level | 'silent' => {
          if (err || res.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR)
            return 'error';
          if (res.statusCode >= HttpStatus.BAD_REQUEST) return 'warn';
          // probes hit these every few seconds
          return isHealthCheck(req) ? 'silent' : 'info';
        },
        // pino-http invents an error for a plain 5xx; the real one (with stack) is
        // logged by Nest's ExceptionsHandler under the same reqId
        customErrorObject: (
          _req: IncomingMessage,
          _res: ServerResponse,
          err: Error,
          value: Record<string, unknown>,
        ) =>
          SYNTHETIC_ERROR.test(err.message)
            ? { ...value, err: undefined }
            : value,
      },
      stream,
    ],
  };
}
