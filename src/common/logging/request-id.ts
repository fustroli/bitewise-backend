import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { config } from '../../config/index.js';

export const REQUEST_ID_HEADER = 'X-Request-Id';

export const MAX_REQUEST_ID_LENGTH = 128;

// uuids, hex ids, trace ids; nothing that could forge a log line or header
const VALID_REQUEST_ID = new RegExp(`^[\\w.:-]{1,${MAX_REQUEST_ID_LENGTH}}$`);

/**
 * The incoming X-Request-Id when a trusted proxy sits in front (TRUST_PROXY_HOPS > 0)
 * and it is well-formed; a fresh uuid otherwise. Echoed back on the response.
 */
export function resolveRequestId(
  req: IncomingMessage,
  res: ServerResponse,
): string {
  const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()];
  const id =
    config.TRUST_PROXY_HOPS > 0 &&
    typeof incoming === 'string' &&
    VALID_REQUEST_ID.test(incoming)
      ? incoming
      : randomUUID();
  res.setHeader(REQUEST_ID_HEADER, id);
  return id;
}
