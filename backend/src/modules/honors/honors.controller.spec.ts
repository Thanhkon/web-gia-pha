import { Test, TestingModule } from '@nestjs/testing';
import { HonorsController } from './honors.controller';
import { HonorsService } from './honors.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateHonorDto } from './dto/create-honor.dto';
import { UpdateHonorDto } from './dto/update-honor.dto';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { UsersService } from '../users/users.service';

describe('HonorsController', () => {
  let controller: HonorsController;
  let honorsService: Record<keyof HonorsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    honorsService = {
      create: jest.fn(),
      findByFamily: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      uploadImage: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HonorsController],
      providers: [
        {
          provide: HonorsService,
          useValue: honorsService,
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<HonorsController>(HonorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreateHonorDto = { title: 'Honor', memberId: 1 };
    await controller.create(1, mockRequest, dto);
    expect(honorsService.create).toHaveBeenCalledWith(1, 1, dto);
  });

  it('should call findByFamily', async () => {
    await controller.findByFamily(1, '2', 'ACTIVE', 'ACADEMIC', false);
    expect(honorsService.findByFamily).toHaveBeenCalledWith(1, {
      memberId: 2,
      status: 'ACTIVE',
      honorType: 'ACADEMIC',
      includeDeleted: false,
    });
  });

  it('should call findOne', async () => {
    await controller.findOne(1);
    expect(honorsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should call update', async () => {
    const dto: UpdateHonorDto = { title: 'Updated' };
    await controller.update(1, dto);
    expect(honorsService.update).toHaveBeenCalledWith(1, dto);
  });

  it('should call uploadImage', async () => {
    const file = {} as UploadedStorageFile;
    await controller.uploadImage(1, file);
    expect(honorsService.uploadImage).toHaveBeenCalledWith(1, file);
  });

  it('should call remove', async () => {
    await controller.remove(1);
    expect(honorsService.remove).toHaveBeenCalledWith(1);
  });

  it('should call restore', async () => {
    await controller.restore(1);
    expect(honorsService.restore).toHaveBeenCalledWith(1);
  });
});
