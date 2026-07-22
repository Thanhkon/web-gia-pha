import { POST_ROLE_LABELS, POST_ROLES } from '../types/posts';

export const mockCurrentUser = {
  id: 'user-family-head-01',
  familyId: 'family-nguyen',
  name: 'Nguyễn Văn Trưởng',
  role: POST_ROLES.FAMILY_HEAD,
  isAuthenticated: true,
  canCreatePost: true,
  canManagePosts: true,
};

export const mockMemberUser = {
  id: 'user-member-thi-b',
  familyId: 'family-nguyen',
  name: 'Nguyễn Thị B',
  role: POST_ROLES.MEMBER,
  isAuthenticated: true,
  canCreatePost: false,
  canManagePosts: false,
};

export const mockOtherFamilyHead = {
  id: 'user-family-head-tran-01',
  familyId: 'family-tran',
  name: 'Trần Văn Quản',
  role: POST_ROLES.FAMILY_HEAD,
  isAuthenticated: true,
  canCreatePost: true,
  canManagePosts: true,
};

export const mockPostCreator = {
  id: mockCurrentUser.id,
  name: mockCurrentUser.name,
  role: POST_ROLE_LABELS[mockCurrentUser.role],
};

export const mockAuthState = {
  user: mockCurrentUser,
  isAuthenticated: mockCurrentUser.isAuthenticated,
};
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

