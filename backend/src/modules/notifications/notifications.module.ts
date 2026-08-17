import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { Family } from '../members/entities/family.entity';

import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

import { MemberAttachment } from '../attachment/entities/member-attachments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Family, MemberAttachment]),
    UsersModule,
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
