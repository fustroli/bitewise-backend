import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function initializeSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BiteWise')
    .setDescription('The BiteWise API description')
    .setVersion('1.0')
    .addTag('bitewise')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
