import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../user/entities/index.js';

export const CurrentUser = createParamDecorator(
  (data: keyof User, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest().user;

    if (!user) return null;
    if (!data) return user;
    return user[data];
  },
);
