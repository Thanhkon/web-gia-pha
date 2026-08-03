import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { CloudinaryProvider } from './storage.provider';

// @Global() để các module khác (posts, albums, members...) chỉ cần
// inject StorageService mà không phải import StorageModule ở mỗi nơi.
// Nếu bạn không muốn Global, xóa dòng @Global() và import StorageModule
// thủ công vào từng module cần dùng.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryProvider, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
