import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

describe('ActivityLogsController', () => {
  let controller: ActivityLogsController;
  let activityLogsService: Record<keyof ActivityLogsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    activityLogsService = {
      log: jest.fn(),
      findByFamily: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogsController],
      providers: [
        {
          provide: ActivityLogsService,
          useValue: activityLogsService,
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ActivityLogsController>(ActivityLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findByFamily with parsed params', async () => {
    await controller.findAll(mockRequest, '1', '2', '10');
    expect(activityLogsService.findByFamily).toHaveBeenCalledWith(1, {
      page: 2,
      limit: 10,
      action: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  });

  it('should throw UnauthorizedException if no user in request', async () => {
    const req = {} as AuthenticatedRequest;
    await expect(async () => {
      await controller.findAll(req, '1');
    }).rejects.toThrow(UnauthorizedException);
  });
});
