import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

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
