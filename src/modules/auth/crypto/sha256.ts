import { createHash } from 'crypto';

/** Hex SHA-256: how bearer secrets (refresh, Email verification) are stored. */
export function sha256(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
