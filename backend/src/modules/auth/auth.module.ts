import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Member } from '../members/entities/member.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { AccessTokenGuard } from './guards/access-token.guard';

@Module({
  imports: [
    UsersModule,
    MailModule,
    TypeOrmModule.forFeature([
      Member,
      RefreshTokenEntity,
      PasswordResetTokenEntity,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
  exports: [AccessTokenGuard],
})
export class AuthModule {}
