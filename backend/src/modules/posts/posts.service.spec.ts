import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Family } from '../members/entities/family.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivityAction } from '../activity-logs/entities/activity-log.entity';

describe('PostsService', () => {
  let service: PostsService;
  let postsRepo: any;
  let familiesRepo: any;
  let storageService: any;
  let permissionsService: any;
  let notificationsService: any;
  let activityLogsService: any;

  beforeEach(async () => {
    postsRepo = {
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

    storageService = {
      upload: jest.fn(),
    };

    permissionsService = {
      assertFamilyMember: jest.fn(),
      isFamilyEditor: jest.fn(),
    };

    notificationsService = {
      createForFamily: jest.fn(),
    };

    activityLogsService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: postsRepo },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: StorageService, useValue: storageService },
        { provide: PermissionsService, useValue: permissionsService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ActivityLogsService, useValue: activityLogsService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
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
        service.create(1, 1, { title: 'Test', content: 'content' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save post and log activity', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      const result = await service.create(1, 1, {
        title: 'Test',
        content: 'content',
      });
      expect(postsRepo.save).toHaveBeenCalled();
      expect(activityLogsService.log).toHaveBeenCalledWith(
        1,
        1,
        ActivityAction.CREATE_POST,
        'post',
        1,
        'Test',
      );
      expect(result.title).toBe('Test');
    });

    it('should notify if post is published', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      await service.create(1, 1, {
        title: 'Test',
        content: 'content',
        status: 'PUBLISHED',
      });
      expect(notificationsService.createForFamily).toHaveBeenCalled();
    });
  });

  describe('uploadImage', () => {
    it('should throw BadRequestException if no file', async () => {
      await expect(service.uploadImage(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should upload to storage', async () => {
      const file = { originalname: 'test.jpg' } as any;

      storageService.upload.mockResolvedValue({
        resourceType: 'image',
        secureUrl: 'http://test.com/img.jpg',
        publicId: 'img_123',
      });

      const result = await service.uploadImage(file);

      expect(storageService.upload).toHaveBeenCalled();
      expect(result.url).toBe('http://test.com/img.jpg');
    });
  });
});
