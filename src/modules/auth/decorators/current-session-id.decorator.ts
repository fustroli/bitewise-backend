import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Set by JwtStrategy as passport's authInfo
export const CurrentSessionId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined =>
    context.switchToHttp().getRequest().authInfo?.sid,
);
