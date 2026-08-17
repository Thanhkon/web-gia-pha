import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { UsersModule } from '../users/users.module';
import { EditRequest } from './entities/edit-request.entity';
import { JoinRequest } from './entities/join-request.entity';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { MemberAttachmentsModule } from '../attachment/member-attachments.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MemberAttachmentsModule,
    NotificationsModule,
    ActivityLogsModule,
    TypeOrmModule.forFeature([EditRequest, JoinRequest, Family, Member]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
