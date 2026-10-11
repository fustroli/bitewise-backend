import { InitialSchema1791708071108 } from './1791708071108-InitialSchema.js';
import { DropUserFacebookId1791720000000 } from './1791720000000-DropUserFacebookId.js';

// Every migration, in order. Listed explicitly rather than globbed: Jest's ESM
// transform can't see glob-loaded files, and int tests run these migrations.
// The schema-drift int test fails if a migration is missing here.
export const migrations = [
  InitialSchema1791708071108,
  DropUserFacebookId1791720000000,
];
