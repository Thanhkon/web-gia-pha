import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { CreateAlbumMediaDto } from './dto/create-album-media.dto';
import { UpdateAlbumMediaDto } from './dto/update-album-media.dto';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';

describe('AlbumsController', () => {
  let controller: AlbumsController;
  let albumsService: Record<keyof AlbumsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    albumsService = {
      create: jest.fn(),
      findByFamily: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      uploadCoverImage: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
      addMedia: jest.fn(),
      uploadMedia: jest.fn(),
      updateMedia: jest.fn(),
      removeMedia: jest.fn(),
      restoreMedia: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [
        {
          provide: AlbumsService,
          useValue: albumsService,
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AlbumsController>(AlbumsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Albums', () => {
    it('should call create', async () => {
      const dto: CreateAlbumDto = { title: 'Test Album' };
      await controller.create(1, mockRequest, dto);
      expect(albumsService.create).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call findByFamily', async () => {
      await controller.findByFamily(1, 'VISIBLE', 'INTERNAL', false);
      expect(albumsService.findByFamily).toHaveBeenCalledWith(1, {
        status: 'VISIBLE',
        visibility: 'INTERNAL',
        includeDeleted: false,
      });
    });

    it('should call findOne', async () => {
      await controller.findOne(1, true);
      expect(albumsService.findOne).toHaveBeenCalledWith(1, {
        includeDeletedMedia: true,
      });
    });

    it('should call update', async () => {
      const dto: UpdateAlbumDto = { title: 'New Title' };
      await controller.update(1, mockRequest, dto);
      expect(albumsService.update).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call uploadCoverImage', async () => {
      const file = {} as UploadedStorageFile;
      await controller.uploadCoverImage(1, mockRequest, file);
      expect(albumsService.uploadCoverImage).toHaveBeenCalledWith(1, 1, file);
    });

    it('should call remove', async () => {
      await controller.remove(1, mockRequest);
      expect(albumsService.remove).toHaveBeenCalledWith(1, 1);
    });

    it('should call restore', async () => {
      await controller.restore(1, mockRequest);
      expect(albumsService.restore).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Media', () => {
    it('should call addMedia', async () => {
      const dto: CreateAlbumMediaDto = {
        url: 'http://test.com',
        type: 'IMAGE',
        fileName: 'test.jpg',
      };
      await controller.addMedia(1, mockRequest, dto);
      expect(albumsService.addMedia).toHaveBeenCalledWith(1, 1, dto);
    });

    it('should call uploadMedia', async () => {
      const file = {} as UploadedStorageFile;
      await controller.uploadMedia(1, mockRequest, 'desc', file);
      expect(albumsService.uploadMedia).toHaveBeenCalledWith(
        1,
        1,
        file,
        'desc',
      );
    });

    it('should call updateMedia', async () => {
      const dto: UpdateAlbumMediaDto = { description: 'New desc' };
      await controller.updateMedia(1, 2, mockRequest, dto);
      expect(albumsService.updateMedia).toHaveBeenCalledWith(1, 2, 1, dto);
    });

    it('should call removeMedia', async () => {
      await controller.removeMedia(1, 2, mockRequest);
      expect(albumsService.removeMedia).toHaveBeenCalledWith(1, 2, 1);
    });

    it('should call restoreMedia', async () => {
      await controller.restoreMedia(1, 2, mockRequest);
      expect(albumsService.restoreMedia).toHaveBeenCalledWith(1, 2, 1);
    });
  });
});
