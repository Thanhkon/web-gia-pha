import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { UsersService } from '../users/users.service';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: Record<keyof PostsService, jest.Mock>;

  const mockRequest = {
    user: { id: 1, username: 'test' },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    postsService = {
      create: jest.fn(),
      findByFamily: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      uploadImage: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: postsService,
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreatePostDto = { title: 'Post', content: 'test' };
    await controller.create(1, mockRequest, dto);
    expect(postsService.create).toHaveBeenCalledWith(1, 1, dto);
  });

  it('should call uploadImage', async () => {
    const file = {} as UploadedStorageFile;
    await controller.uploadImage(file);
    expect(postsService.uploadImage).toHaveBeenCalledWith(file);
  });

  it('should call findByFamily', async () => {
    await controller.findByFamily(1, 'PUBLISHED', 'PUBLIC', false);
    expect(postsService.findByFamily).toHaveBeenCalledWith(1, {
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      includeDeleted: false,
    });
  });

  it('should call findOne', async () => {
    await controller.findOne(1);
    expect(postsService.findOne).toHaveBeenCalledWith(1);
  });

  it('should call update', async () => {
    const dto: UpdatePostDto = { title: 'Updated' };
    await controller.update(1, mockRequest, dto);
    expect(postsService.update).toHaveBeenCalledWith(1, 1, dto);
  });

  it('should call remove', async () => {
    await controller.remove(1, mockRequest);
    expect(postsService.remove).toHaveBeenCalledWith(1, 1);
  });

  it('should call restore', async () => {
    await controller.restore(1, mockRequest);
    expect(postsService.restore).toHaveBeenCalledWith(1, 1);
  });
});
