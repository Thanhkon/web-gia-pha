import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { User } from '../users/entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { MemberAttachmentsModule } from '../attachment/member-attachments.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Member]), MemberAttachmentsModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
