import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Gia Phả API')
    .setDescription('Tài liệu API cho hệ thống quản lý Gia Phả')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (process.env.NODE_ENV === 'production') {
    const requiredEnv = [
      'JWT_SECRET',
      'DB_TYPE',
      'DB_HOST',
      'DB_PORT',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
    ];
    for (const env of requiredEnv) {
      if (!process.env[env]) {
        throw new Error(
          `Missing required environment variable in production: ${env}`,
        );
      }
    }

    if (process.env.DB_SYNCHRONIZE === 'true') {
      throw new Error('DB_SYNCHRONIZE must not be true in production');
    }
  }

  // Khởi tạo các thư mục lưu file tĩnh
  const uploadAvatarDir = join(process.cwd(), 'uploads', 'avatars');
  const uploadFamilyAvatarDir = join(process.cwd(), 'uploads', 'family-avatar');

  if (!existsSync(uploadAvatarDir)) {
    mkdirSync(uploadAvatarDir, { recursive: true });
  }
  if (!existsSync(uploadFamilyAvatarDir)) {
    mkdirSync(uploadFamilyAvatarDir, { recursive: true });
  }

  // Phục vụ tài nguyên tĩnh công khai từ thư mục uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const envOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowedOrigins =
    envOrigins && envOrigins.length > 0
      ? envOrigins
      : ['http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
