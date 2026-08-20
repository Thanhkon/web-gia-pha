import { Test, TestingModule } from '@nestjs/testing';
import { HonorsService } from './honors.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Honor } from './entities/honor.entity';
import { Family } from '../members/entities/family.entity';
import { Member } from '../members/entities/member.entity';
import { StorageService } from '../../common/storage/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('HonorsService', () => {
  let service: HonorsService;
  let honorsRepo: any;
  let familiesRepo: any;
  let membersRepo: any;
  let storageService: any;

  beforeEach(async () => {
    honorsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

    familiesRepo = {
      exists: jest.fn(),
    };

    membersRepo = {
      exists: jest.fn(),
    };

    storageService = {
      upload: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HonorsService,
        { provide: getRepositoryToken(Honor), useValue: honorsRepo },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: getRepositoryToken(Member), useValue: membersRepo },
        { provide: StorageService, useValue: storageService },
      ],
    }).compile();

    service = module.get<HonorsService>(HonorsService);
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
        service.create(1, 1, { title: 'Test', memberId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if member does not exist in family', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.exists.mockResolvedValue(false);
      await expect(
        service.create(1, 1, { title: 'Test', memberId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should save honor', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      membersRepo.exists.mockResolvedValue(true);
      const result = await service.create(1, 1, { title: 'Test', memberId: 1 });
      expect(honorsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('Test');
    });
  });

  describe('uploadImage', () => {
    it('should upload to storage and save honor entity', async () => {
      honorsRepo.findOne.mockResolvedValue({ id: 1, familyId: 1 });
      const file = { originalname: 'test.jpg' } as any;

      storageService.upload.mockResolvedValue({
        resourceType: 'image',
        secureUrl: 'http://test.com/img.jpg',
        publicId: 'img_123',
      });

      const result = await service.uploadImage(1, file);

      expect(storageService.upload).toHaveBeenCalled();
      expect(honorsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'http://test.com/img.jpg',
        }),
      );
      expect(result.imageUrl).toBe('http://test.com/img.jpg');
    });
  });
});
