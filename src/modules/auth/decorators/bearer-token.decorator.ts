import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface IBearerTokenOptions {
  // Absent is undefined rather than a 401
  optional?: boolean;
}

// The raw `Authorization: Bearer <token>`; 401 when absent unless optional
export const BearerToken = createParamDecorator(
  (
    options: IBearerTokenOptions | undefined,
    context: ExecutionContext,
  ): string | undefined => {
    const header: string | undefined = context.switchToHttp().getRequest()
      .headers.authorization;
    const [scheme, token] = header?.split(' ') ?? [];

    if (scheme?.toLowerCase() === 'bearer' && token) return token;
    if (options?.optional) return undefined;
    throw new UnauthorizedException();
  },
);
