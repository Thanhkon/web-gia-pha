import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { ForbiddenException } from '@nestjs/common';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let usersRepo: any;
  let membersRepo: any;
  let memberAttachmentsService: any;

  beforeEach(async () => {
    usersRepo = {
      findOne: jest.fn(),
    };

    membersRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    memberAttachmentsService = {
      canEditFamily: jest.fn(),
      canEdit: jest.fn(),
      hasAccessFamily: jest.fn(),
      hasAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        {
          provide: MemberAttachmentsService,
          useValue: memberAttachmentsService,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isFamilyEditor', () => {
    it('should return true if user is admin', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 1, isAdmin: true });
      const result = await service.isFamilyEditor(1, 1);
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const result = await service.isFamilyEditor(1, 1);
      expect(result).toBe(false);
    });
  });

  describe('assertFamilyEditor', () => {
    it('should throw ForbiddenException if not allowed', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 1, isAdmin: false });
      memberAttachmentsService.canEditFamily.mockResolvedValue(false);
      membersRepo.find.mockResolvedValue([]);
      await expect(service.assertFamilyEditor(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should not throw if allowed', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 1, isAdmin: true });
      await expect(service.assertFamilyEditor(1, 1)).resolves.not.toThrow();
    });
  });
});
