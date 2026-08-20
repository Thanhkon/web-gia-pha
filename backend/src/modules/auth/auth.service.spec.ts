import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Member } from '../members/entities/member.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { PasswordResetTokenEntity } from './entities/password-reset-token.entity';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';

// Mock the util.promisify to mock scrypt
jest.mock('node:util', () => ({
  ...jest.requireActual('node:util'),
  promisify: jest.fn().mockImplementation((fn) => fn),
}));

// Mock crypto module
jest.mock('node:crypto', () => ({
  ...jest.requireActual('node:crypto'),
  createHmac: jest.fn(),
  createHash: jest.fn(),
  randomBytes: jest.fn(),
  scrypt: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Record<keyof UsersService, jest.Mock>;
  let memberRepository: any;
  let refreshTokenRepository: any;
  let passwordResetTokenRepository: any;
  let mailService: Record<keyof MailService, jest.Mock>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
      findById: jest.fn(),
      createEntity: jest.fn(),
      updatePasswordHash: jest.fn(),
      toPublicUser: jest.fn(),
    } as any;

    memberRepository = {
      findOne: jest.fn(),
    };

    refreshTokenRepository = {
      save: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    passwordResetTokenRepository = {
      save: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      findOne: jest.fn(),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: getRepositoryToken(Member), useValue: memberRepository },
        {
          provide: getRepositoryToken(RefreshTokenEntity),
          useValue: refreshTokenRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetTokenEntity),
          useValue: passwordResetTokenRepository,
        },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default crypto mocks
    (crypto.randomBytes as jest.Mock).mockReturnValue(
      Buffer.from('random-bytes'),
    );
    (crypto.scrypt as jest.Mock).mockResolvedValue(
      Buffer.from('hashed-password'),
    );

    const mockHmac = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('signature'),
    };
    (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);

    const mockHash = {
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token'),
    };
    (crypto.createHash as jest.Mock).mockReturnValue(mockHash);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if username is missing', async () => {
      await expect(
        service.register({ username: '', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if password < 6 chars', async () => {
      await expect(
        service.register({ username: 'test', password: '123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if user exists', async () => {
      usersService.findByUsername.mockResolvedValue({ id: 1 } as any);
      await expect(
        service.register({ username: 'test', password: 'password' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return auth response', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createEntity.mockResolvedValue({
        id: 1,
        username: 'test',
      } as any);
      usersService.toPublicUser.mockReturnValue({
        id: 1,
        username: 'test',
      } as any);
      memberRepository.findOne.mockResolvedValue({
        id: 1,
        fullName: 'Test Name',
      });

      const result = await service.register({
        username: 'test',
        password: 'password',
      });

      expect(usersService.createEntity).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.fullName).toBe('Test Name');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      await expect(
        service.login({ username: 'test', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      usersService.findByUsername.mockResolvedValue({
        id: 1,
        passwordHash: 'salt:hash',
      } as any);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);

      await expect(
        service.login({ username: 'test', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return auth response on successful login', async () => {
      usersService.findByUsername.mockResolvedValue({
        id: 1,
        passwordHash: 'salt:' + Buffer.from('hashed-password').toString('hex'),
      } as any);
      (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);
      usersService.toPublicUser.mockReturnValue({
        id: 1,
        username: 'test',
      } as any);

      const result = await service.login({
        username: 'test',
        password: 'password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should revoke token and return success', async () => {
      const mockToken = { id: 1, tokenHash: 'hash' };
      refreshTokenRepository.findOne.mockResolvedValue(mockToken);

      const result = await service.logout({ refreshToken: 'token' });

      expect(refreshTokenRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(result.message).toBe('Logged out');
    });
  });

  describe('forgotPassword', () => {
    it('should generate token and send email if user exists', async () => {
      usersService.findByUsername.mockResolvedValue({ id: 1 } as any);

      await service.forgotPassword({ username: 'test' });

      expect(passwordResetTokenRepository.save).toHaveBeenCalled();
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should just return message if user not found (security)', async () => {
      usersService.findByUsername.mockResolvedValue(null);

      const result = await service.forgotPassword({ username: 'unknown' });

      expect(passwordResetTokenRepository.save).not.toHaveBeenCalled();
      expect(result.message).toBeDefined();
    });
  });
});
