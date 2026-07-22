import { AuthUser, MockAuthState, UserRole } from '../types/auth';
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

export const mockRoleLabels = {
  [UserRole.FAMILY_HEAD]: 'Trưởng họ',
  [UserRole.MEMBER]: 'Thành viên',
  [UserRole.GUEST]: 'Khách',
};

export const mockCurrentUser: AuthUser = {
  id: 'user-family-head-01',
  familyId: 'family-nguyen',
  memberId: 'member-family-head-01',
  name: 'Nguyễn Văn Trưởng',
  role: UserRole.FAMILY_HEAD,
  isAuthenticated: true,
  permissions: {
    canManagePosts: true,
    canCreatePost: true,
  },
  canCreatePost: true,
  canManagePosts: true,
};

export const mockMemberUser: AuthUser = {
  id: 'user-member-thi-b',
  familyId: 'family-nguyen',
  memberId: 'member-thi-b',
  name: 'Nguyễn Thị B',
  role: UserRole.MEMBER,
  isAuthenticated: true,
  permissions: {
    canManagePosts: false,
    canCreatePost: false,
  },
  canCreatePost: false,
  canManagePosts: false,
};

export const mockEventCreator = {
  id: mockCurrentUser.id,
  name: mockCurrentUser.name,
};

export const mockPostCreator = {
  ...mockEventCreator,
  role: mockRoleLabels[mockCurrentUser.role],
};

export const mockAuthState: MockAuthState = {
  user: null,
  isAuthenticated: false,
};
