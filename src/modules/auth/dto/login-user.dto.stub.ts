import { LoginUserDto } from './index.js';

export const stubLoginUserDto = (): LoginUserDto => {
  return {
    email: 'email@bitewise.com',
    password: 'StrongPassword1',
  };
};
