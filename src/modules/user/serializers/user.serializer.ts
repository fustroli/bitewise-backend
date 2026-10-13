import { config } from '../../../config/index.js';
import { User } from '../entities/index.js';
import type { IPendingEmailChange } from '../service/index.js';

export type TUserResponse = User & {
  avatarUrl: string | null;
  pendingEmail: string | null;
  pendingEmailExpiresAt: Date | null;
};

/**
 * The User with `avatarUrl` built from the stored key (`avatarKey` stays
 * excluded) and their pending Email change, if any.
 */
export function toUserResponse(
  user: User,
  pending: IPendingEmailChange | null = null,
): TUserResponse {
  return Object.assign(new User(), user, {
    avatarUrl: user.avatarKey
      ? `${config.S3.CDN_BASE_URL}/${user.avatarKey}`
      : null,
    pendingEmail: pending?.email ?? null,
    pendingEmailExpiresAt: pending?.expiresAt ?? null,
  });
}
