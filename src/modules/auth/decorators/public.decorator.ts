import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

export const IS_PUBLIC_KEY = 'isPublic';
// Read by initializeSwagger to drop the global bearer requirement
export const PUBLIC_API_EXTENSION = 'x-public';

/**
 * Opts a route (or every route of a controller) out of the global JwtGuard.
 * Routes are authenticated by default.
 */
export const Public = () =>
  applyDecorators(
    SetMetadata(IS_PUBLIC_KEY, true),
    ApiExtension(PUBLIC_API_EXTENSION, true),
  );
