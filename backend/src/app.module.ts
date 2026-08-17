import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StorageModule } from './common/storage/storage.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { RequestsModule } from './modules/requests/requests.module';
import { PostsModule } from './modules/posts/posts.module';
import { EventsModule } from './modules/events/events.module';
import { HonorsModule } from './modules/honors/honors.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { MemberAttachmentsModule } from './modules/attachment/member-attachments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: configService.getOrThrow<'postgres'>('DB_TYPE'),
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true',
        retryAttempts: Number(
          configService.getOrThrow<string>('DB_RETRY_ATTEMPTS'),
        ),
      }),
    }),
    StorageModule,
    UsersModule,
    AuthModule,
    MembersModule,
    RequestsModule,
    PostsModule,
    EventsModule,
    HonorsModule,
    AlbumsModule,
    MemberAttachmentsModule,
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
