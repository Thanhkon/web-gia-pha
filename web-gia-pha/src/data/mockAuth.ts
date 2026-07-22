import { MockCurrentUser, UserRole } from '../types/events';

export const mockCurrentUser: MockCurrentUser = {
  id: 'user-family-head-01',
  familyId: 'family-nguyen',
  name: 'Nguyễn Văn Trưởng',
  role: UserRole.FAMILY_HEAD,
};

export const mockEventCreator = {
  id: mockCurrentUser.id,
  name: mockCurrentUser.name,
};

