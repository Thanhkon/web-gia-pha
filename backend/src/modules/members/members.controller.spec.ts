import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { UsersService } from '../users/users.service';

describe('MembersController', () => {
  let controller: MembersController;

  beforeEach(async () => {
    const mockMembersService = {};
    const mockUsersService = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        { provide: MembersService, useValue: mockMembersService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    controller = module.get<MembersController>(MembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
