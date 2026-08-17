import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsService } from './albums.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Album } from './entities/album.entity';
import { AlbumMedia } from './entities/album-media.entity';
import { Family } from '../members/entities/family.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';

describe('AlbumsService', () => {
  let service: AlbumsService;

  beforeEach(async () => {
    const mockRepo = {};
    const mockStorage = {};
    const mockPermissions = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        { provide: getRepositoryToken(Album), useValue: mockRepo },
        { provide: getRepositoryToken(AlbumMedia), useValue: mockRepo },
        { provide: getRepositoryToken(Family), useValue: mockRepo },
        { provide: StorageService, useValue: mockStorage },
        { provide: PermissionsService, useValue: mockPermissions },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
