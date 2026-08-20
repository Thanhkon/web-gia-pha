import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: any;

  beforeEach(async () => {
    usersRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((dto) => ({ id: 1, ...dto, isAdmin: false })),
      find: jest.fn().mockResolvedValue([{ id: 1, isAdmin: false }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, isAdmin: false }),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEntity', () => {
    it('should throw if username exists', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 2 });
      await expect(
        service.createEntity({ username: 'test' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const user = await service.createEntity({
        username: 'test',
        password: 'password',
      });
      expect(user.id).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should return safe user', async () => {
      usersRepo.findOne.mockResolvedValue({
        id: 1,
        isAdmin: false,
        passwordHash: 'hash',
        username: 'test',
      });
      const user = await service.findOne(1);
      expect((user as any).passwordHash).toBeUndefined();
    });
  });
});
