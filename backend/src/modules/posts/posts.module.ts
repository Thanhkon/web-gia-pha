import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Family } from '../members/entities/family.entity';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([Post, Family]),
    PermissionsModule,
    NotificationsModule,
    ActivityLogsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
