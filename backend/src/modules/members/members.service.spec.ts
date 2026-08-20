import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { Member } from './entities/member.entity';
import { ParentChildRelation } from './entities/parent-child-relation.entity';
import { Marriage } from './entities/marriage.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

describe('MembersService', () => {
  let service: MembersService;
  let familiesRepo: any;
  let membersRepo: any;
  let parentChildRepo: any;
  let marriagesRepo: any;
  let storageService: any;
  let permissionsService: any;
  let memberAttachmentsService: any;
  let activityLogsService: any;

  beforeEach(async () => {
    familiesRepo = {
      createQueryBuilder: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      exists: jest.fn(),
      merge: jest.fn(),
      delete: jest.fn(),
    };

    membersRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      merge: jest.fn(),
    };

    parentChildRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
    };

    marriagesRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
    };

    storageService = {
      upload: jest.fn(),
    };

    permissionsService = {
      assertFamilyEditor: jest.fn(),
    };

    memberAttachmentsService = {
      findAllByUser: jest.fn().mockResolvedValue([]),
      createFamilyEditor: jest.fn(),
    };

    activityLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        {
          provide: getRepositoryToken(ParentChildRelation),
          useValue: parentChildRepo,
        },
        { provide: getRepositoryToken(Marriage), useValue: marriagesRepo },
        { provide: StorageService, useValue: storageService },
        { provide: PermissionsService, useValue: permissionsService },
        {
          provide: MemberAttachmentsService,
          useValue: memberAttachmentsService,
        },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllFamilies', () => {
    it('should return families with roles', async () => {
      familiesRepo.getMany.mockResolvedValue([{ id: 1, name: 'Family A' }]);
      memberAttachmentsService.findAllByUser.mockResolvedValue([
        { familyId: 1, role: 'editor' },
      ]);

      const result = await service.findAllFamilies(1);
      expect(result).toEqual([{ id: 1, name: 'Family A', role: 'editor' }]);
    });
  });

  describe('createFamily', () => {
    it('should throw BadRequestException if name is missing', async () => {
      await expect(service.createFamily({ name: '' }, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create family, initial member, and editor attachment', async () => {
      familiesRepo.findOne.mockResolvedValue(null); // generateUniqueFamilyCode returns first try

      const result = await service.createFamily({ name: 'Test Family' }, 1);

      expect(familiesRepo.create).toHaveBeenCalled();
      expect(familiesRepo.save).toHaveBeenCalled();
      expect(membersRepo.create).toHaveBeenCalled();
      expect(membersRepo.save).toHaveBeenCalled();
      expect(memberAttachmentsService.createFamilyEditor).toHaveBeenCalledWith(
        1,
        1,
        1,
      );
      expect(result.id).toBe(1);
    });
  });

  describe('createMember', () => {
    it('should throw NotFoundException if family does not exist', async () => {
      familiesRepo.exists.mockResolvedValue(false);
      await expect(
        service.createMember(1, 1, { fullName: 'Test', generation: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save member and log activity', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      const dto = { fullName: 'Test Member', generation: 2 };

      const result = await service.createMember(1, 1, dto);

      expect(permissionsService.assertFamilyEditor).toHaveBeenCalledWith(1, 1);
      expect(membersRepo.save).toHaveBeenCalled();
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        1,
        ActivityAction.ADD_MEMBER,
        'member',
        1,
        'Test Member',
      );
      expect(result.fullName).toBe('Test Member');
    });
  });

  describe('createParentChildRelation', () => {
    it('should throw BadRequest if parent and child are same', async () => {
      await expect(
        service.createParentChildRelation({ parentId: 1, childId: 1 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if relation already exists', async () => {
      membersRepo.findOne.mockResolvedValue({ id: 1, familyId: 1 });
      parentChildRepo.findOne.mockResolvedValue({ id: 1 }); // relation exists

      await expect(
        service.createParentChildRelation({ parentId: 1, childId: 2 }, 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should save relation successfully', async () => {
      membersRepo.findOne
        .mockResolvedValueOnce({ id: 1, familyId: 1 })
        .mockResolvedValueOnce({ id: 2, familyId: 1 });
      parentChildRepo.findOne.mockResolvedValue(null);

      await service.createParentChildRelation({ parentId: 1, childId: 2 }, 1);
      expect(parentChildRepo.save).toHaveBeenCalled();
    });
  });

  describe('createMarriage', () => {
    it('should save marriage successfully', async () => {
      membersRepo.findOne
        .mockResolvedValueOnce({ id: 1, familyId: 1 })
        .mockResolvedValueOnce({ id: 2, familyId: 1 });
      marriagesRepo.findOne.mockResolvedValue(null);

      await service.createMarriage({ memberAId: 1, memberBId: 2 }, 1);
      expect(marriagesRepo.save).toHaveBeenCalled();
    });
  });
});
