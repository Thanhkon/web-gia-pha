import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createHmac,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';

const scrypt = promisify(scryptCallback);
const RESET_PASSWORD_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? 'dev-secret-key';

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    @InjectRepository(PasswordResetTokenEntity)
    private readonly passwordResetTokenRepository: Repository<PasswordResetTokenEntity>,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = this.normalizeEmail(registerDto.email);
    const password = registerDto.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const name = registerDto.name?.trim();
    const user = await this.usersService.createEntity({
      email,
      password,
      ...(name ? { name } : {}),
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const email = this.normalizeEmail(loginDto.email);
    const password = loginDto.password ?? '';
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.verifyPassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken?.trim();

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshTokenEntity = await this.findRefreshToken(refreshToken);

    if (
      !refreshTokenEntity ||
      refreshTokenEntity.revokedAt ||
      this.isRefreshTokenExpired(refreshTokenEntity)
    ) {
      if (refreshTokenEntity) {
        await this.revokeRefreshToken(refreshTokenEntity);
      }

      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(refreshTokenEntity.userId);

    if (!user) {
      await this.revokeRefreshToken(refreshTokenEntity);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.revokeRefreshToken(refreshTokenEntity);

    return this.buildAuthResponse(user);
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.refreshToken?.trim();

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const refreshTokenEntity = await this.findRefreshToken(refreshToken);

    if (refreshTokenEntity && !refreshTokenEntity.revokedAt) {
      await this.revokeRefreshToken(refreshTokenEntity);
    }

    return {
      message: 'Logged out',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = this.normalizeEmail(forgotPasswordDto.email);

    if (!email) {
      throw new BadRequestException('Valid email is required');
    }

    const response = {
      message: 'If the email exists, a password reset token has been created',
    };
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return response;
    }

    const resetToken = randomBytes(32).toString('base64url');
    const resetPasswordTokenHash = this.hashToken(resetToken);
    const resetPasswordExpiresAt = new Date(
      Date.now() + RESET_PASSWORD_TOKEN_TTL_MS,
    );

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash: resetPasswordTokenHash,
        expiresAt: resetPasswordExpiresAt,
      }),
    );

    return {
      ...response,
      resetToken,
      expiresAt: resetPasswordExpiresAt,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const token = resetPasswordDto.token?.trim();
    const newPassword = this.normalizePassword(resetPasswordDto.newPassword);

    if (!token) {
      throw new BadRequestException('Reset token is required');
    }

    this.validateNewPassword(newPassword);

    const resetTokenEntity = await this.findResetPasswordToken(token);

    if (
      !resetTokenEntity ||
      resetTokenEntity.usedAt ||
      this.isResetTokenExpired(resetTokenEntity)
    ) {
      if (resetTokenEntity && !resetTokenEntity.usedAt) {
        await this.markResetTokenUsed(resetTokenEntity);
      }

      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findById(resetTokenEntity.userId);

    if (!user) {
      await this.markResetTokenUsed(resetTokenEntity);
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.usersService.updatePasswordHash(
      user,
      await this.hashPassword(newPassword),
    );
    await this.markResetTokenUsed(resetTokenEntity);
    await this.revokeActiveRefreshTokensByUserId(user.id);

    return {
      message: 'Password has been reset',
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const email = this.normalizeEmail(changePasswordDto.email);
    const currentPassword = changePasswordDto.currentPassword ?? '';
    const newPassword = this.normalizePassword(changePasswordDto.newPassword);

    if (!email) {
      throw new BadRequestException('Valid email is required');
    }

    this.validateNewPassword(newPassword);

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.verifyPassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updatePasswordHash(
      user,
      await this.hashPassword(newPassword),
    );
    await this.revokeActiveRefreshTokensByUserId(user.id);

    return {
      message: 'Password has been changed',
    };
  }

  private async buildAuthResponse(user: User) {
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      }),
    );

    return {
      accessToken: this.signJwt({
        sub: user.id,
        email: user.email,
      }),
      refreshToken,
      refreshTokenExpiresAt,
      user: this.usersService.toPublicUser(user),
    };
  }

  private signJwt(payload: Record<string, string | number>) {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    const jwtPayload = {
      ...payload,
      iat: nowInSeconds,
      exp: nowInSeconds + 60 * 60 * 24,
    };
    const encodedHeader = this.base64UrlEncode(header);
    const encodedPayload = this.base64UrlEncode(jwtPayload);
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('base64url');

    return `${data}.${signature}`;
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async verifyPassword(password: string, passwordHash: string) {
    const [salt, storedHash] = passwordHash.split(':');

    if (!salt || !storedHash) {
      return false;
    }

    const hash = (await scrypt(password, salt, 64)) as Buffer;
    const storedHashBuffer = Buffer.from(storedHash, 'hex');

    if (hash.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(hash, storedHashBuffer);
  }

  private base64UrlEncode(value: object) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private validateNewPassword(password: string) {
    if (!password) {
      throw new BadRequestException('New password is required');
    }

    if (password.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters',
      );
    }
  }

  private normalizePassword(password?: string) {
    return password?.trim() ?? '';
  }

  private findRefreshToken(refreshToken: string) {
    return this.refreshTokenRepository.findOne({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
  }

  private findResetPasswordToken(token: string) {
    return this.passwordResetTokenRepository.findOne({
      where: { tokenHash: this.hashToken(token) },
    });
  }

  private async revokeRefreshToken(refreshToken: RefreshTokenEntity) {
    refreshToken.revokedAt = new Date();

    return this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeActiveRefreshTokensByUserId(userId: number) {
    await this.refreshTokenRepository.update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  private async markResetTokenUsed(resetToken: PasswordResetTokenEntity) {
    resetToken.usedAt = new Date();

    return this.passwordResetTokenRepository.save(resetToken);
  }

  private isResetTokenExpired(resetToken: PasswordResetTokenEntity) {
    return resetToken.expiresAt.getTime() <= Date.now();
  }

  private isRefreshTokenExpired(refreshToken: RefreshTokenEntity) {
    return refreshToken.expiresAt.getTime() <= Date.now();
  }

  private normalizeEmail(email?: string) {
    const normalizedEmail = email?.trim().toLowerCase() ?? '';

    if (!normalizedEmail.includes('@')) {
      return '';
    }

    return normalizedEmail;
  }
}
