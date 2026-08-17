import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { UsersService } from '../users/users.service';

describe('AlbumsController', () => {
  let controller: AlbumsController;

  beforeEach(async () => {
    const mockAlbumsService = {};
    const mockUsersService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [
        { provide: AlbumsService, useValue: mockAlbumsService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<AlbumsController>(AlbumsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
