import { Test, TestingModule } from '@nestjs/testing';
import { MemberAttachmentsService } from './member-attachments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MemberAttachment } from './entities/member-attachments.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('MemberAttachmentsService', () => {
  let service: MemberAttachmentsService;
  let repo: any;

  beforeEach(async () => {
    repo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemberAttachmentsService,
        { provide: getRepositoryToken(MemberAttachment), useValue: repo },
      ],
    }).compile();

    service = module.get<MemberAttachmentsService>(MemberAttachmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException if both memberId and familyId provided', async () => {
      await expect(
        service.create({
          memberId: 1,
          familyId: 1,
          userId: 1,
          role: 'EDITOR',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if member already managed', async () => {
      repo.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.create({ memberId: 1, userId: 1, role: 'EDITOR' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should create attachment', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.create({
        memberId: 1,
        userId: 1,
        role: 'EDITOR',
      } as any);
      expect(result).toHaveProperty('id');
    });
  });

  describe('findOne', () => {
    it('should throw if not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });
});
