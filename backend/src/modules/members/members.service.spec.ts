import { Test, TestingModule } from '@nestjs/testing';
import { MembersService } from './members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { Member } from './entities/member.entity';
import { ParentChildRelation } from './entities/parent-child-relation.entity';
import { Marriage } from './entities/marriage.entity';
import { StorageService } from '../../common/storage/storage.service';
import { PermissionsService } from '../permissions/permissions.service';
import { MemberAttachmentsService } from '../attachment/member-attachments.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

describe('MembersService', () => {
  let service: MembersService;

  beforeEach(async () => {
    const mockRepo = {};
    const mockStorage = {};
    const mockPermissions = {};
    const mockAttachments = {};
    const mockLogs = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: getRepositoryToken(Family), useValue: mockRepo },
        { provide: getRepositoryToken(Member), useValue: mockRepo },
        {
          provide: getRepositoryToken(ParentChildRelation),
          useValue: mockRepo,
        },
        { provide: getRepositoryToken(Marriage), useValue: mockRepo },
        { provide: StorageService, useValue: mockStorage },
        { provide: PermissionsService, useValue: mockPermissions },
        { provide: MemberAttachmentsService, useValue: mockAttachments },
        { provide: ActivityLogsService, useValue: mockLogs },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
