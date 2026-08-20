import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsService } from './activity-logs.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityAction, ActivityLog } from './entities/activity-log.entity';
import { UsersService } from '../users/users.service';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let activityLogsRepo: any;
  let usersService: any;
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };

    activityLogsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    usersService = {
      findById: jest.fn().mockResolvedValue({ id: 1, fullName: 'Test User' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: activityLogsRepo,
        },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should query user and save activity log', async () => {
      await service.log(1, 1, ActivityAction.CREATE_POST, 'post', 1, 'Title');
      expect(usersService.findById).toHaveBeenCalledWith(1);
      expect(activityLogsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorName: 'Test User',
        }),
      );
      expect(activityLogsRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByFamily', () => {
    it('should build query and return paginated data', async () => {
      const result = await service.findByFamily(1, { limit: 10 });
      expect(activityLogsRepo.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
