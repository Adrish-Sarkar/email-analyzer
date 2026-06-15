import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate all incoming request bodies against their DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // strip unknown properties
    forbidNonWhitelisted: true, // reject requests with unexpected fields
    transform: true,           // auto-transform payloads to DTO instances
  }));

  // Enable backend access rules for front-end frameworks
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type',
  });

  // Re-bind to your original designated express port
  await app.listen(5001);
  console.log(`🚀 NestJS Server processing on: http://localhost:5001`);
}
bootstrap();