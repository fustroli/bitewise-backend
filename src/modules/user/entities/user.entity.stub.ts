import { User } from './user.entity.js';

export function stubUser(override: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@mail.com',
    ingredients: [],
    hash: 'hashedPassword',
    meals: [],
    personalInformation: {
      userName: null,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      dateOfBirth: null,
    },
    socialProfiles: {
      facebook: null,
      twitter: null,
      instagram: null,
      linkedin: null,
    },
    notificationSettings: {
      defaultEmailAddress: null,
      communicationEmail: false,
      marketingEmail: false,
      securityEmail: true,
    },
    avatarUrl: null,
    googleId: null,
    facebookId: null,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
    ...override,
  };
}
