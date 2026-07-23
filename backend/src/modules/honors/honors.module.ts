import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { UsersModule } from '../users/users.module';
import { Honor } from './entities/honor.entity';
import { HonorsController } from './honors.controller';
import { HonorsService } from './honors.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([Honor, Family, Member]),
  ],
  controllers: [HonorsController],
  providers: [HonorsService],
})
export class HonorsModule {}
