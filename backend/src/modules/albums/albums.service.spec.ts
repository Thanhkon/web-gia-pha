import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsService } from './albums.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Album } from './entities/album.entity';
import { AlbumMedia } from './entities/album-media.entity';
import { Family } from '../members/entities/family.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let albumsRepo: any;
  let albumMediaRepo: any;
  let familiesRepo: any;
  let storageService: any;
  let permissionsService: any;

  beforeEach(async () => {
    albumsRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

    albumMediaRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
      findOne: jest.fn(),
      merge: jest.fn(),
    };

    familiesRepo = {
      exists: jest.fn(),
    };

    storageService = {
      upload: jest.fn(),
    };

    permissionsService = {
      assertFamilyEditor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: getRepositoryToken(Album), useValue: albumsRepo },
        { provide: getRepositoryToken(AlbumMedia), useValue: albumMediaRepo },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: StorageService, useValue: storageService },
        { provide: PermissionsService, useValue: permissionsService },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
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
        service.create(1, 1, { title: 'Test Album' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if title is missing', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      await expect(service.create(1, 1, { title: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should save and return the album', async () => {
      familiesRepo.exists.mockResolvedValue(true);
      const result = await service.create(1, 1, { title: 'My Album' });
      expect(albumsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('My Album');
    });
  });

  describe('remove', () => {
    it('should soft delete the album', async () => {
      const album = { id: 1, familyId: 1, deletedAt: null };
      albumsRepo.findOne.mockResolvedValue(album);

      const result = await service.remove(1, 1);
      expect(permissionsService.assertFamilyEditor).toHaveBeenCalledWith(1, 1);
      expect(albumsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
      expect(result.deleted).toBe(true);
    });
  });

  describe('uploadMedia', () => {
    it('should upload to storage and save media entity', async () => {
      const album = { id: 1, familyId: 1, deletedAt: null };
      albumsRepo.findOne.mockResolvedValue(album);
      const file = { originalname: 'test.jpg' } as any;

      storageService.upload.mockResolvedValue({
        resourceType: 'image',
        secureUrl: 'http://test.com/img.jpg',
        publicId: 'img_123',
      });

      const result = await service.uploadMedia(1, 1, file, 'Test description');

      expect(storageService.upload).toHaveBeenCalled();
      expect(albumMediaRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'IMAGE',
          url: 'http://test.com/img.jpg',
          description: 'Test description',
        }),
      );
      expect(result.url).toBe('http://test.com/img.jpg');
    });
  });

  describe('updateMedia', () => {
    it('should update media details', async () => {
      const album = { id: 1, familyId: 1 };
      const media = { id: 1, albumId: 1, type: 'IMAGE' };
      albumsRepo.findOne.mockResolvedValue(album);
      albumMediaRepo.findOne.mockResolvedValue(media);

      await service.updateMedia(1, 1, 1, { description: 'Updated' });

      expect(albumMediaRepo.merge).toHaveBeenCalledWith(media, {
        description: 'Updated',
      });
      expect(albumMediaRepo.save).toHaveBeenCalled();
    });
  });
});
