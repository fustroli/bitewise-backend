import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

// The raw `Authorization: Bearer <token>`; 401 when absent
export const BearerToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const header: string | undefined = context.switchToHttp().getRequest()
      .headers.authorization;
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token)
      throw new UnauthorizedException();
    return token;
  },
);
