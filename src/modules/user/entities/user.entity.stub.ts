import { User } from './user.entity.js';

export function stubUser(override: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'test@mail.com',
    ingredients: [],
    hash: 'hashedPassword',
    meals: [],
    personalInformation: null,
    socialProfiles: null,
    notificationSettings: null,
    avatarUrl: null,
    googleId: null,
    facebookId: null,
    createTimeStamp: new Date(),
    updateTimeStamp: new Date(),
    deleteTimeStamp: null,
    ...override,
  };
}
