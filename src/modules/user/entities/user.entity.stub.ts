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
    bodyStats: {
      sex: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      neckCm: null,
      waistCm: null,
      hipCm: null,
    },
    notificationSettings: {
      defaultEmailAddress: null,
      communicationEmail: false,
      marketingEmail: false,
      securityEmail: true,
    },
    avatarKey: null,
    googleId: null,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
    ...override,
  };
}
