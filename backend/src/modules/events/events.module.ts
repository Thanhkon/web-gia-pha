import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { UsersModule } from '../users/users.module';
import { PermissionsModule } from '../permissions/permissions.module'; // 👈 thêm
import { Event } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([Event, Family, Member]),
    PermissionsModule,
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
