import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberAttachment } from './entities/member-attachments.entity';
import { MemberAttachmentsService } from './member-attachments.service';
import { MemberAttachmentsController } from './member-attachments.controller';
import { UsersModule } from '../users/users.module';
// TODO: import UsersModule đúng path — cần cho AccessTokenGuard vì guard này inject UsersService

@Module({
  imports: [TypeOrmModule.forFeature([MemberAttachment]), UsersModule],
  controllers: [MemberAttachmentsController],
  providers: [MemberAttachmentsService],
  exports: [MemberAttachmentsService], // export để members.module.ts dùng canEdit() khi cần
})
export class MemberAttachmentsModule {}
