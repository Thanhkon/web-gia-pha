import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EditRequest } from './entities/edit-request.entity';
import { JoinRequest } from './entities/join-request.entity';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { DataSource } from 'typeorm';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateEditRequestDto } from './dto/create-edit-request.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

describe('RequestsService', () => {
  let service: RequestsService;
  let editRequestsRepo: any;
  let joinRequestsRepo: any;
  let familiesRepo: any;
  let membersRepo: any;
  let dataSource: any;
  let memberAttachmentsService: any;
  let usersService: any;
  let notificationsService: any;
  let activityLogsService: any;

  beforeEach(async () => {
    editRequestsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    joinRequestsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    familiesRepo = {
      exists: jest.fn(),
    };

    membersRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((dto) => dto),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => {
        return cb({
          getRepository: (entity: any) => {
            if (entity === EditRequest) return editRequestsRepo;
            if (entity === JoinRequest) return joinRequestsRepo;
            if (entity === Member) return membersRepo;
            return null;
          },
        });
      }),
    };

    memberAttachmentsService = {
      createFamilyEditor: jest.fn(),
      createFamilyViewer: jest.fn(),
    };

    usersService = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    notificationsService = {
      createForFamily: jest.fn(),
      createForUser: jest.fn(),
    };

    activityLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        {
          provide: getRepositoryToken(EditRequest),
          useValue: editRequestsRepo,
        },
        {
          provide: getRepositoryToken(JoinRequest),
          useValue: joinRequestsRepo,
        },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        { provide: DataSource, useValue: dataSource },
        {
          provide: MemberAttachmentsService,
          useValue: memberAttachmentsService,
        },
        { provide: UsersService, useValue: usersService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create EditRequest', () => {
    it('should throw NotFoundException if family does not exist', async () => {
      familiesRepo.exists.mockResolvedValue(false);
      await expect(service.create(1, {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if member does not exist', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create(1, { targetMemberId: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if changes are invalid', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.findOne.mockResolvedValue({ id: 1 });
      const dto: CreateEditRequestDto = {
        targetMemberId: 1,
        reason: 'test',
        submittedByName: 'Test User',
        changes: {}, // empty changes
      };
      await expect(service.create(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('should save edit request and create notification', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.findOne.mockResolvedValue({ id: 1 });
      const dto: CreateEditRequestDto = {
        targetMemberId: 1,
        reason: 'test',
        submittedByName: 'Test User',
        changes: { fullName: { old: 'Old', new: 'New Name' } },
      };

      const result = await service.create(1, dto);

      expect(editRequestsRepo.save).toHaveBeenCalled();
      expect(notificationsService.createForFamily).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('approve EditRequest', () => {
    it('should approve, apply changes to member, log activity and notify', async () => {
      const mockRequest = {
        id: 1,
        status: 'PENDING',
        requestType: 'edit_member',
        familyId: 1,
        targetMemberId: 1,
        submittedById: 2,
        changes: { fullName: { old: 'Old', new: 'Changed' } },
      };
      editRequestsRepo.findOne.mockResolvedValue(mockRequest);
      membersRepo.findOne.mockResolvedValue({ id: 1, fullName: 'Old' });

      await service.approve(1, 1, { adminNote: 'ok' });

      expect(membersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Changed' }),
      );
      expect(editRequestsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      );
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        1,
        ActivityAction.APPROVE_REQUEST,
        'edit_request',
        1,
        'Changed',
      );
      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        2,
        'REQUEST_APPROVED',
        expect.any(String),
        expect.any(String),
        1,
      );
    });
  });

  describe('createJoinRequest', () => {
    it('should create join request if valid', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.findOne.mockResolvedValue({ id: 1 });
      joinRequestsRepo.findOne.mockResolvedValue(null);

      const dto: CreateJoinRequestDto = { familyId: 1, targetMemberId: 1 };
      await service.createJoinRequest(1, dto);

      expect(joinRequestsRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if request already pending', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.findOne.mockResolvedValue({ id: 1 });
      joinRequestsRepo.findOne.mockResolvedValue({ id: 1 }); // existing

      const dto: CreateJoinRequestDto = { familyId: 1, targetMemberId: 1 };
      await expect(service.createJoinRequest(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('approveJoinRequest', () => {
    it('should approve, assign role, sync info, and notify', async () => {
      const mockJoinRequest = {
        id: 1,
        status: 'PENDING',
        familyId: 1,
        targetMemberId: 2,
        userId: 1,
      };
      joinRequestsRepo.findOne.mockResolvedValue(mockJoinRequest);
      usersService.findById.mockResolvedValue({ id: 1, fullName: null });
      membersRepo.findOne.mockResolvedValue({ id: 2, fullName: 'Member Name' });

      await service.approveJoinRequest(1, 1, {
        role: 'viewer',
        adminNote: 'welcome',
      });

      expect(memberAttachmentsService.createFamilyViewer).toHaveBeenCalledWith(
        1,
        1,
        2,
      );
      expect(usersService.update).toHaveBeenCalledWith(1, {
        fullName: 'Member Name',
      });
      expect(joinRequestsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'APPROVED' }),
      );
      expect(notificationsService.createForUser).toHaveBeenCalledWith(
        1,
        'JOIN_APPROVED',
        expect.any(String),
        expect.any(String),
        1,
      );
    });
  });
});
