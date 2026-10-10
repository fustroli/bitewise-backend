export type TSocialProvider = 'google' | 'facebook';

// What an OAuth strategy hands to SessionService.signInSocial
export interface ISocialProfile {
  provider: TSocialProvider;
  providerId: string;
  email: string;
  emailVerified: boolean;
}
