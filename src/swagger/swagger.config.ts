import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { PUBLIC_API_EXTENSION } from '../modules/auth/decorators/index.js';

export function initializeSwagger(app: INestApplication) {
  SwaggerModule.setup('api/docs', app, createSwaggerDocument(app));
}

export function createSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('BiteWise')
    .setDescription('The BiteWise API description')
    .setVersion('1.0')
    .addTag('bitewise')
    // Routes are authenticated by default, like the global JwtGuard
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .build();
  return withPublicRoutes(SwaggerModule.createDocument(app, config));
}

// @Public() routes need no access token: drop the global requirement on them
function withPublicRoutes(document: OpenAPIObject): OpenAPIObject {
  for (const path of Object.values(document.paths))
    for (const operation of Object.values(path))
      if (operation?.[PUBLIC_API_EXTENSION]) {
        delete operation[PUBLIC_API_EXTENSION];
        operation.security ??= [];
      }
  return document;
}
