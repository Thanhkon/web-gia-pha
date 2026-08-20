import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Family } from '../members/entities/family.entity';
import { MemberAttachment } from '../attachment/entities/member-attachments.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepo: any;
  let memberAttachmentsRepo: any;
  let eventEmitter: any;

  beforeEach(async () => {
    notificationsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => {
        if (Array.isArray(dto)) return dto.map((d: any) => ({ id: 1, ...d }));
        return { id: 1, ...dto };
      }),
      find: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    memberAttachmentsRepo = {
      find: jest
        .fn()
        .mockResolvedValue([{ userId: 1 }, { userId: 2 }, { userId: 1 }]),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationsRepo,
        },
        { provide: getRepositoryToken(Family), useValue: {} },
        {
          provide: getRepositoryToken(MemberAttachment),
          useValue: memberAttachmentsRepo,
        },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createForFamily', () => {
    it('should notify unique users from member attachments', async () => {
      await service.createForFamily(1, 'NEW_EVENT', 'Title', 'Content');
      expect(memberAttachmentsRepo.find).toHaveBeenCalledWith({
        where: { familyId: 1 },
      });

      // Since memberAttachmentsRepo returned userId 1, 2, 1, the unique set is [1, 2]
      expect(notificationsRepo.create).toHaveBeenCalledTimes(2);
      expect(notificationsRepo.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('markAsRead', () => {
    it('should update read status', async () => {
      await service.markAsRead(1, 1);
      expect(notificationsRepo.update).toHaveBeenCalledWith(
        { id: 1, recipientId: 1 },
        { isRead: true },
      );
    });
  });
});
