import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('NEXUS Core NestJS')
    .setDescription('The NEXUS Enterprise AI Core API')
    .setVersion('1.0')
    .addTag('nexus')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 5005);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
