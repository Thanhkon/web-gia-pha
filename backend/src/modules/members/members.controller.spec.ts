import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { CreateParentChildRelationDto } from './dto/create-parent-child-relation.dto';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';

describe('MembersController', () => {
  let controller: MembersController;
  let membersService: Record<keyof MembersService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    membersService = {
      findAllFamilies: jest.fn(),
      createFamily: jest.fn(),
      findFamilyByCode: jest.fn(),
      findOneFamily: jest.fn(),
      updateFamily: jest.fn(),
      uploadFamilyCover: jest.fn(),
      removeFamily: jest.fn(),
      findMembersByFamily: jest.fn(),
      createMember: jest.fn(),
      findOneMemberInFamily: jest.fn(),
      findOneMember: jest.fn(),
      updateMember: jest.fn(),
      uploadMemberAvatar: jest.fn(),
      removeMember: jest.fn(),
      createParentChildRelation: jest.fn(),
      createMarriage: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: membersService,
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            toPublicUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('families', () => {
    it('should call createFamily', async () => {
      const dto: CreateFamilyDto = { name: 'Test Family' };
      await controller.createFamily(mockRequest, dto);
      expect(membersService.createFamily).toHaveBeenCalledWith(dto, 1);
    });

    it('should call findAllFamilies', async () => {
      await controller.findAllFamilies(mockRequest);
      expect(membersService.findAllFamilies).toHaveBeenCalledWith(1);
    });

    it('should call findFamilyByCode', async () => {
      await controller.findFamilyByCode('123456');
      expect(membersService.findFamilyByCode).toHaveBeenCalledWith('123456');
    });

    it('should call findOneFamily', async () => {
      await controller.findOneFamily(1);
      expect(membersService.findOneFamily).toHaveBeenCalledWith(1);
    });

    it('should call updateFamily', async () => {
      const dto: UpdateFamilyDto = { name: 'New Name' };
      await controller.updateFamily(1, mockRequest, dto);
      expect(membersService.updateFamily).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call uploadFamilyCover', async () => {
      const file = { buffer: Buffer.from('test') } as UploadedStorageFile;
      await controller.uploadFamilyCover(1, mockRequest, file);
      expect(membersService.uploadFamilyCover).toHaveBeenCalledWith(1, 1, file);
    });

    it('should call removeFamily', async () => {
      await controller.removeFamily(1, mockRequest);
      expect(membersService.removeFamily).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('members', () => {
    it('should call findMembersByFamily', async () => {
      await controller.findMembersByFamily(1);
      expect(membersService.findMembersByFamily).toHaveBeenCalledWith(1);
    });

    it('should call createMember', async () => {
      const dto: CreateMemberDto = { fullName: 'John', generation: 2 };
      await controller.createMember(1, mockRequest, dto);
      expect(membersService.createMember).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call findOneMemberInFamily', async () => {
      await controller.findOneMemberInFamily(1, 2);
      expect(membersService.findOneMemberInFamily).toHaveBeenCalledWith(1, 2);
    });

    it('should call findOneMember', async () => {
      await controller.findOneMember(1);
      expect(membersService.findOneMember).toHaveBeenCalledWith(1);
    });

    it('should call updateMember', async () => {
      const dto: UpdateMemberDto = { fullName: 'John Doe' };
      await controller.updateMember(1, mockRequest, dto);
      expect(membersService.updateMember).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call uploadMemberAvatar', async () => {
      const file = { buffer: Buffer.from('test') } as UploadedStorageFile;
      await controller.uploadMemberAvatar(1, mockRequest, file);
      expect(membersService.uploadMemberAvatar).toHaveBeenCalledWith(
        1,
        1,
        file,
      );
    });

    it('should call removeMember', async () => {
      await controller.removeMember(1, mockRequest);
      expect(membersService.removeMember).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('relations', () => {
    it('should call createParentChildRelation', async () => {
      const dto: CreateParentChildRelationDto = { parentId: 1, childId: 2 };
      await controller.createParentChildRelation(mockRequest, dto);
      expect(membersService.createParentChildRelation).toHaveBeenCalledWith(
        dto,
        1,
      );
    });

    it('should call createMarriage', async () => {
      const dto: CreateMarriageDto = { memberAId: 1, memberBId: 2 };
      await controller.createMarriage(mockRequest, dto);
      expect(membersService.createMarriage).toHaveBeenCalledWith(dto, 1);
    });
  });
});
