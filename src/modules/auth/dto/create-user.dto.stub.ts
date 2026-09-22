import { CreateUserDto } from './index.js';
import { stubLoginUserDto } from './login-user.dto.stub.js';

export const stubCreateUserDto = (): CreateUserDto => {
  return {
    ...stubLoginUserDto(),
    confirmPassword: 'StrongPassword1',
  };
};
