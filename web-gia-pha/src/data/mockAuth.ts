import { AuthUser, MockAuthState, UserRole } from '../types/auth';
import { POST_ROLE_LABELS } from '../types/posts';

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
  role: POST_ROLE_LABELS[mockCurrentUser.role],
};

export const mockAuthState: MockAuthState = {
  user: null,
  isAuthenticated: false,
};
