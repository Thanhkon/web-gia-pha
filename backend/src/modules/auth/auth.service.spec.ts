/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from '../members/entities/member.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';

describe('AuthService', () => {
  let service: AuthService;
  let testingModule: TestingModule;

  beforeEach(async () => {
    const mockUsersService = {};
    const mockMemberRepo = {};
    const mockRefreshTokenRepo = {};
    const mockPasswordResetRepo = {};
    const mockMailService = {};

    testingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: getRepositoryToken(Member), useValue: mockMemberRepo },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: mockRefreshTokenRepo,
        },
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: mockPasswordResetRepo,
        },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = testingModule.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should return a generic message and not leak token', async () => {
      const mockUsersService = testingModule.get(UsersService);
      mockUsersService.findByUsername = jest
        .fn()
        .mockResolvedValue({ id: 1, username: 'testuser' });

      const mockMailService = testingModule.get(MailService);
      mockMailService.sendPasswordResetEmail = jest
        .fn()
        .mockResolvedValue(true);

      const mockPasswordResetRepo = testingModule.get(
        getRepositoryToken(PasswordResetTokenEntity),
      );
      mockPasswordResetRepo.create = jest.fn().mockReturnValue({});
      mockPasswordResetRepo.save = jest.fn().mockResolvedValue({});

      const result = await service.forgotPassword({ username: 'testuser' });

      expect(result).toHaveProperty(
        'message',
        'If the username exists, a password reset token has been created',
      );
      expect(result).not.toHaveProperty('token');
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reject invalid or incorrect token', async () => {
      const mockPasswordResetRepo = testingModule.get(
        getRepositoryToken(PasswordResetTokenEntity),
      );
      mockPasswordResetRepo.findOne = jest.fn().mockResolvedValue(null);
      mockPasswordResetRepo.save = jest.fn().mockResolvedValue({});

      await expect(
        service.resetPassword({
          resetToken: 'wrong-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject expired token', async () => {
      const mockPasswordResetRepo = testingModule.get(
        getRepositoryToken(PasswordResetTokenEntity),
      );
      mockPasswordResetRepo.findOne = jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() - 10000), // Expired
        usedAt: null,
      });
      mockPasswordResetRepo.save = jest.fn().mockResolvedValue({});

      await expect(
        service.resetPassword({
          resetToken: 'expired-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reject already used token', async () => {
      const mockPasswordResetRepo = testingModule.get(
        getRepositoryToken(PasswordResetTokenEntity),
      );
      mockPasswordResetRepo.findOne = jest.fn().mockResolvedValue({
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() + 10000),
        usedAt: new Date(), // Used
      });
      mockPasswordResetRepo.save = jest.fn().mockResolvedValue({});

      await expect(
        service.resetPassword({
          resetToken: 'used-token',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow('Invalid or expired reset token');
    });

    it('should reset password for valid token and mark it as used', async () => {
      const mockPasswordResetRepo = testingModule.get(
        getRepositoryToken(PasswordResetTokenEntity),
      );
      const mockTokenEntity = {
        id: 1,
        userId: 1,
        expiresAt: new Date(Date.now() + 10000),
        usedAt: null,
      };
      mockPasswordResetRepo.findOne = jest
        .fn()
        .mockResolvedValue(mockTokenEntity);
      mockPasswordResetRepo.save = jest.fn().mockResolvedValue(mockTokenEntity);

      const mockUsersService = testingModule.get(UsersService);
      mockUsersService.findById = jest.fn().mockResolvedValue({ id: 1 });
      mockUsersService.updatePasswordHash = jest.fn().mockResolvedValue(true);

      const mockRefreshTokenRepo = testingModule.get(
        getRepositoryToken(RefreshTokenEntity),
      );
      mockRefreshTokenRepo.update = jest.fn().mockResolvedValue(true);

      const result = await service.resetPassword({
        resetToken: 'valid-token',
        newPassword: 'NewPassword123!',
      });

      expect(result).toHaveProperty('message', 'Password has been reset');
      expect(mockTokenEntity.usedAt).toBeInstanceOf(Date);
      expect(mockPasswordResetRepo.save).toHaveBeenCalledWith(mockTokenEntity);
      expect(mockUsersService.updatePasswordHash).toHaveBeenCalledWith(
        { id: 1 },
        expect.any(String),
      );
    });
  });
});
