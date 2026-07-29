import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  const allowedOrigins =
    process.env.CORS_ORIGIN?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  });

  // Cấu hình thư mục tĩnh để hiển thị ảnh từ src/images
  app.useStaticAssets(join(__dirname, '..', 'src/images'), {
    prefix: '/images/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();