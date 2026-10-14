import { InitialSchema1791708071108 } from './1791708071108-InitialSchema.js';
import { DropUserFacebookId1791720000000 } from './1791720000000-DropUserFacebookId.js';
import { AddUserActiveGoogleId1791730000000 } from './1791730000000-AddUserActiveGoogleId.js';
import { AddSessionExpiresAtIndex1791740000000 } from './1791740000000-AddSessionExpiresAtIndex.js';
import { RenameUserAvatarUrlToAvatarKey1791750000000 } from './1791750000000-RenameUserAvatarUrlToAvatarKey.js';
import { AddEmailVerification1791903793794 } from './1791903793794-AddEmailVerification.js';
import { LowercaseUserEmails1791990000000 } from './1791990000000-LowercaseUserEmails.js';
import { AddEmailChange1792000000000 } from './1792000000000-AddEmailChange.js';
import { DropUserNotificationSettings1792100000000 } from './1792100000000-DropUserNotificationSettings.js';

// Every migration, in order. Listed explicitly rather than globbed: Jest's ESM
// transform can't see glob-loaded files, and int tests run these migrations.
// The schema-drift int test fails if a migration is missing here.
export const migrations = [
  InitialSchema1791708071108,
  DropUserFacebookId1791720000000,
  AddUserActiveGoogleId1791730000000,
  AddSessionExpiresAtIndex1791740000000,
  RenameUserAvatarUrlToAvatarKey1791750000000,
  AddEmailVerification1791903793794,
  LowercaseUserEmails1791990000000,
  AddEmailChange1792000000000,
  DropUserNotificationSettings1792100000000,
];
