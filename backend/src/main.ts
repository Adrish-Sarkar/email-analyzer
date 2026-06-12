import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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