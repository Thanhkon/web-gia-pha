import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateEditRequestDto } from './dto/create-edit-request.dto';
import { ReviewEditRequestDto } from './dto/review-edit-request.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { ReviewJoinRequestDto } from './dto/review-join-request.dto';

describe('RequestsController', () => {
  let controller: RequestsController;
  let requestsService: Record<keyof RequestsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    requestsService = {
      create: jest.fn(),
      findByFamily: jest.fn(),
      findOne: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      remove: jest.fn(),
      createJoinRequest: jest.fn(),
      findJoinRequestsByFamily: jest.fn(),
      approveJoinRequest: jest.fn(),
      rejectJoinRequest: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: requestsService,
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Edit Requests', () => {
    it('should call create', async () => {
      const dto: CreateEditRequestDto = {
        targetMemberId: 1,
        changes: {},
        reason: 'test',
        submittedByName: 'Test User',
      };
      await controller.create(mockRequest, 1, dto);
      expect(requestsService.create).toHaveBeenCalledWith(1, dto, 1);
    });

    it('should call findByFamily', async () => {
      await controller.findByFamily(1, 'PENDING');
      expect(requestsService.findByFamily).toHaveBeenCalledWith(1, 'PENDING');
    });

    it('should call findOne', async () => {
      await controller.findOne(1);
      expect(requestsService.findOne).toHaveBeenCalledWith(1);
    });

    it('should call approve', async () => {
      const dto: ReviewEditRequestDto = { adminNote: 'ok' };
      await controller.approve(mockRequest, 1, dto);
      expect(requestsService.approve).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call reject', async () => {
      const dto: ReviewEditRequestDto = { adminNote: 'no' };
      await controller.reject(mockRequest, 1, dto);
      expect(requestsService.reject).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call remove', async () => {
      await controller.remove(1);
      expect(requestsService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('Join Requests', () => {
    it('should call createJoinRequest', async () => {
      const dto: CreateJoinRequestDto = { familyId: 1, targetMemberId: 1 };
      await controller.createJoinRequest(mockRequest, dto);
      expect(requestsService.createJoinRequest).toHaveBeenCalledWith(1, dto);
    });

    it('should call findJoinRequestsByFamily', async () => {
      await controller.findJoinRequestsByFamily(1, 'APPROVED');
      expect(requestsService.findJoinRequestsByFamily).toHaveBeenCalledWith(
        1,
        'APPROVED',
      );
    });

    it('should call approveJoinRequest', async () => {
      const dto: ReviewJoinRequestDto = { role: 'viewer' };
      await controller.approveJoinRequest(mockRequest, 1, dto);
      expect(requestsService.approveJoinRequest).toHaveBeenCalledWith(
        1,
        1,
        dto,
      );
    });

    it('should call rejectJoinRequest', async () => {
      const dto: ReviewJoinRequestDto = { adminNote: 'no' };
      await controller.rejectJoinRequest(mockRequest, 1, dto);
      expect(requestsService.rejectJoinRequest).toHaveBeenCalledWith(1, 1, dto);
    });
  });
});
