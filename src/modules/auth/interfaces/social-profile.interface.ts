export type TSocialProvider = 'google';

// What an OAuth strategy hands to SessionService.signInSocial
export interface ISocialProfile {
  provider: TSocialProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
}
