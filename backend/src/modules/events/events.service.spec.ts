import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotFoundException } from '@nestjs/common';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepo: any;
  let familiesRepo: any;
  let membersRepo: any;
  let storageService: any;
  let permissionsService: any;
  let notificationsService: any;
  let activityLogsService: any;

  beforeEach(async () => {
    eventsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => {
        dto.id = 1;
        return dto;
      }),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

    familiesRepo = {
      exists: jest.fn(),
    };

    membersRepo = {
      exists: jest.fn(),
    };

    storageService = {
      upload: jest.fn(),
    };

    permissionsService = {
      assertFamilyEditor: jest.fn(),
    };

    notificationsService = {
      createForFamily: jest.fn(),
    };

    activityLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: eventsRepo },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        { provide: StorageService, useValue: storageService },
        { provide: PermissionsService, useValue: permissionsService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if family does not exist', async () => {
      familiesRepo.exists.mockResolvedValue(false);
      await expect(
        service.create(1, 1, {
          title: 'Test',
          startAt: new Date().toISOString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save event and log activity', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      const result = await service.create(1, 1, {
        title: 'Test',
        startAt: new Date().toISOString(),
      });
      expect(eventsRepo.save).toHaveBeenCalled();
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        1,
        ActivityAction.CREATE_EVENT,
        'event',
        1,
        'Test',
      );
      expect(result.title).toBe('Test');
    });
  });

  describe('uploadCoverImage', () => {
    it('should upload to storage and save event entity', async () => {
      eventsRepo.findOne.mockResolvedValue({ id: 1, familyId: 1 });
      const file = { originalname: 'test.jpg' } as any;

      storageService.upload.mockResolvedValue({
        resourceType: 'image',
        secureUrl: 'http://test.com/img.jpg',
        publicId: 'img_123',
      });

      const result = await service.uploadCoverImage(1, 1, file);

      expect(storageService.upload).toHaveBeenCalled();
      expect(eventsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          coverImageUrl: 'http://test.com/img.jpg',
        }),
      );
      expect(result.coverImageUrl).toBe('http://test.com/img.jpg');
    });
  });
});
