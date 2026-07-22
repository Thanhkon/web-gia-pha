export enum UserRole {
  GUEST = 'GUEST',
  MEMBER = 'MEMBER',
  FAMILY_HEAD = 'FAMILY_HEAD',
}

export interface AuthPermissions {
  canManagePosts?: boolean;
  canCreatePost?: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  familyId: string;
  memberId?: string | null;
  isAuthenticated?: boolean;
  permissions?: AuthPermissions;
  canCreatePost?: boolean;
  canManagePosts?: boolean;
}

export interface MockAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
