import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: Record<keyof NotificationsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    notificationsService = {
      createForUser: jest.fn(),
      createForFamily: jest.fn(),
      findAll: jest.fn(),
      countUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: EventEmitter2,
          useValue: { on: jest.fn(), emit: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    await controller.findAll(mockRequest);
    expect(notificationsService.findAll).toHaveBeenCalledWith(1);
  });

  it('should call countUnread', async () => {
    await controller.countUnread(mockRequest);
    expect(notificationsService.countUnread).toHaveBeenCalledWith(1);
  });

  it('should call markAllAsRead', async () => {
    await controller.markAllAsRead(mockRequest);
    expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(1);
  });

  it('should call markAsRead', async () => {
    await controller.markAsRead(1, mockRequest);
    expect(notificationsService.markAsRead).toHaveBeenCalledWith(1, 1);
  });

  it('should throw UnauthorizedException if no user in request', async () => {
    const req = {} as AuthenticatedRequest;
    await expect(async () => {
      await controller.findAll(req);
    }).rejects.toThrow(UnauthorizedException);
  });
});
