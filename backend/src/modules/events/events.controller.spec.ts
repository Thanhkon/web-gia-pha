import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: Record<keyof EventsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    eventsService = {
      create: jest.fn(),
      findByFamily: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      uploadCoverImage: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: eventsService,
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreateEventDto = {
      title: 'Event',
      startAt: new Date().toISOString(),
    };
    await controller.create(1, mockRequest, dto);
    expect(eventsService.create).toHaveBeenCalledWith(1, 1, dto);
  });

  it('should call uploadCoverImage', async () => {
    const file = {} as UploadedStorageFile;
    await controller.uploadCoverImage(1, mockRequest, file);
    expect(eventsService.uploadCoverImage).toHaveBeenCalledWith(1, 1, file);
  });

  it('should call findByFamily', async () => {
    await controller.findByFamily(1, 'UPCOMING', 'PUBLIC', 'MEETING', false);
    expect(eventsService.findByFamily).toHaveBeenCalledWith(1, {
      status: 'UPCOMING',
      visibility: 'PUBLIC',
      eventType: 'MEETING',
      includeDeleted: false,
    });
  });

  it('should call findOne', async () => {
    await controller.findOne(1);
    expect(eventsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should call update', async () => {
    const dto: UpdateEventDto = { title: 'Updated' };
    await controller.update(1, mockRequest, dto);
    expect(eventsService.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('should call remove', async () => {
    await controller.remove(1, mockRequest);
    expect(eventsService.remove).toHaveBeenCalledWith(1, 1);
  });

  it('should call restore', async () => {
    await controller.restore(1, mockRequest);
    expect(eventsService.restore).toHaveBeenCalledWith(1, 1);
  });

  it('should throw UnauthorizedException if no user in request', async () => {
    const req = {} as AuthenticatedRequest;
    await expect(async () => {
      await controller.create(1, req, {} as CreateEventDto);
    }).rejects.toThrow(UnauthorizedException);
  });
});
