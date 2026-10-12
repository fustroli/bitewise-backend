import { config } from '../../../config/index.js';
import { User } from '../entities/index.js';

/** The User with `avatarUrl` built from the stored key; `avatarKey` stays excluded. */
export function toUserResponse(
  user: User,
): User & { avatarUrl: string | null } {
  return Object.assign(new User(), user, {
    avatarUrl: user.avatarKey
      ? `${config.S3.CDN_BASE_URL}/${user.avatarKey}`
      : null,
  });
}
