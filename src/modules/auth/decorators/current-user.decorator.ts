import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IAuthenticatedUser } from '../interfaces/index.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthenticatedUser =>
    context.switchToHttp().getRequest<Request>().user,
);
