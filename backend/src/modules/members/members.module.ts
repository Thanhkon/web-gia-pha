import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Family } from './entities/family.entity';
import { Marriage } from './entities/marriage.entity';
import { Member } from './entities/member.entity';
import { ParentChildRelation } from './entities/parent-child-relation.entity';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PermissionsModule } from '../permissions/permissions.module';
import { MemberAttachmentsModule } from '../attachment/member-attachments.module';
// 👆 sửa lại path cho đúng vị trí thực tế nếu khác

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([Family, Member, ParentChildRelation, Marriage]),
    PermissionsModule,
    MemberAttachmentsModule, // 👈 thêm: MembersService cần MemberAttachmentsService
  ],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}