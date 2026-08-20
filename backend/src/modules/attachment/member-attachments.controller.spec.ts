import { Test, TestingModule } from '@nestjs/testing';
import { MemberAttachmentsController } from './member-attachments.controller';
import { MemberAttachmentsService } from './member-attachments.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';

describe('MemberAttachmentsController', () => {
  let controller: MemberAttachmentsController;
  let service: Record<keyof MemberAttachmentsService, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllByUser: jest.fn(),
      findByMember: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      canEdit: jest.fn(),
      hasAccess: jest.fn(),
      canEditFamily: jest.fn(),
      hasAccessFamily: jest.fn(),
      createFamilyEditor: jest.fn(),
      createFamilyViewer: jest.fn(),
      createMemberAttachment: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberAttachmentsController],
      providers: [
        {
          provide: MemberAttachmentsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(AccessTokenGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MemberAttachmentsController>(
      MemberAttachmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    await controller.create({} as any);
    expect(service.create).toHaveBeenCalled();
  });

  it('should call findAllByUser', async () => {
    await controller.findAllByUser(1);
    expect(service.findAllByUser).toHaveBeenCalledWith(1);
  });

  it('should call findByMember', async () => {
    await controller.findByMember(1);
    expect(service.findByMember).toHaveBeenCalledWith(1);
  });

  it('should call findOne', async () => {
    await controller.findOne(1);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should call update', async () => {
    await controller.update(1, {});
    expect(service.update).toHaveBeenCalledWith(1, {});
  });

  it('should call remove', async () => {
    await controller.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
