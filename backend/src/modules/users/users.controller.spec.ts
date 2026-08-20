import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Record<keyof UsersService, jest.Mock>;

  const adminRequest = {
    user: { id: 1, isAdmin: true, username: 'admin' },
  } as unknown as AuthenticatedRequest;

  const normalRequest = {
    user: { id: 2, isAdmin: false, username: 'user' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      saveAvatarFile: jest.fn(),
      getUserByUsername: jest.fn(),
      createEntity: jest.fn(),
      updatePasswordHash: jest.fn(),
      toPublicUser: jest.fn(),
      getUserInfo: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should throw ForbiddenException if not admin', async () => {
      await expect(async () => {
        await controller.create(normalRequest, {} as CreateUserDto);
      }).rejects.toThrow(ForbiddenException);
    });

    it('should create user if admin', async () => {
      await controller.create(adminRequest, {} as CreateUserDto);
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should throw ForbiddenException if not admin', async () => {
      await expect(async () => {
        await controller.findAll(normalRequest);
      }).rejects.toThrow(ForbiddenException);
    });

    it('should find all if admin', async () => {
      await controller.findAll(adminRequest);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return profile', async () => {
      await controller.getProfile(normalRequest);
      expect(usersService.findOne).toHaveBeenCalledWith(2);
    });
  });

  describe('updateProfile', () => {
    it('should remove role if not admin', async () => {
      await controller.updateProfile(normalRequest, { role: 'ADMIN' } as any);
      expect(usersService.update).toHaveBeenCalledWith(2, {});
    });
  });

  describe('uploadAvatar', () => {
    it('should throw BadRequestException if no file', () => {
      expect(() => {
        controller.uploadAvatar(undefined as any);
      }).toThrow(BadRequestException);
    });

    it('should return url', () => {
      usersService.saveAvatarFile.mockReturnValue('url');
      const res = controller.uploadAvatar({} as any);
      expect(res).toEqual({ url: 'url' });
    });
  });
});
