import { UserRole } from '../types/auth';
import { ALBUM_STATUS, ALBUM_VISIBILITY } from '../types/gallery';
import { EventVisibility } from '../types/events';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');
const normalizeFamilyId = (value: any) => String(value || DEFAULT_FAMILY_ID);

export const normalizeRole = (role: any) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === UserRole.ADMIN) return UserRole.ADMIN;
  if (normalizedRole === UserRole.FAMILY_HEAD) return UserRole.FAMILY_HEAD;
  if (normalizedRole === UserRole.MEMBER) return UserRole.MEMBER;
  return UserRole.GUEST;
};

// ==========================================
// GALLERY PERMISSIONS
// ==========================================

export function getGalleryActor(user: any, isAuthenticated: boolean = Boolean(user), currentFamilyId: any = null) {
  const role = normalizeRole(user?.role);

  if (!isAuthenticated || !user || !user.id || role === UserRole.GUEST) {
    return null;
  }

  return {
    id: String(user.id),
    name: user.name || user.username || user.email || 'Nguoi dung',
    role,
    familyId: currentFamilyId || normalizeFamilyId(user.familyId),
    memberId: user.memberId || null,
  };
}

export function canManageAlbum(actor: any, album?: any) {
  if (!actor || (actor.role !== UserRole.FAMILY_HEAD && actor.role !== UserRole.ADMIN) || !actor.familyId) {
    return false;
  }
  return album ? String(album.familyId) === String(actor.familyId) : true;
}

export const canCreateAlbum = (actor: any) => canManageAlbum(actor);
export const canUpdateAlbum = canManageAlbum;
export const canDeleteAlbum = canManageAlbum;
export const canUploadMedia = canManageAlbum;
export const canUpdateMedia = canManageAlbum;
export const canDeleteMedia = canManageAlbum;

export function canViewAlbum(actor: any, album: any) {
  if (!album) return false;
  if (canManageAlbum(actor, album)) return true;
  if (album.status !== ALBUM_STATUS.VISIBLE) return false;
  if (album.visibility === ALBUM_VISIBILITY.PUBLIC) return true;

  return Boolean(
    actor
      && actor.role === UserRole.MEMBER
      && actor.memberId
      && String(actor.familyId) === String(album.familyId)
  );
}

export function assertManager(actor: any, item: any, message: any) {
  if (!canManageAlbum(actor, item)) {
    throw new Error(message);
  }
}

// ==========================================
// EVENT PERMISSIONS
// ==========================================

export function getEventActor(user: any, isAuthenticated: boolean = Boolean(user), currentFamilyId: any = null) {
  const role = normalizeRole(user?.role);

  if (!isAuthenticated || !user || !user.id || role === UserRole.GUEST) {
    return null; // Guest or unauthenticated users can't perform authenticated event actions
  }

  return {
    id: String(user.id),
    name: user.name || user.username || user.email || 'Nguoi dung',
    role,
    familyId: currentFamilyId || normalizeFamilyId(user.familyId),
    memberId: user.memberId || null,
  };
}

export const canCreateEvent = (actor: any) => {
  if (!actor || !actor.familyId) return false;
  return actor.role === UserRole.ADMIN || actor.role === UserRole.FAMILY_HEAD;
};

export const canManageEvent = (actor: any, event?: any) => {
  if (!canCreateEvent(actor)) return false;
  if (!event) return true; // General check
  return String(event.familyId) === String(actor.familyId);
};

export const canViewEvent = (actor: any, event: any) => {
  if (!event) return false;
  if (canManageEvent(actor, event)) return true;
  
  if (event.status !== 'SCHEDULED' && event.status !== 'ONGOING') return false;
  if (event.visibility === EventVisibility.PUBLIC) return true;

  return Boolean(
    actor
    && actor.role === UserRole.MEMBER
    && actor.memberId
    && String(actor.familyId) === String(event.familyId)
  );
};

// ==========================================
// POST PERMISSIONS
// ==========================================

export function getPostActor(user: any, isAuthenticated: boolean = Boolean(user), currentFamilyId: any = null) {
  const role = normalizeRole(user?.role);
  if (!isAuthenticated || !user || !user.id || role === UserRole.GUEST) {
    return {
      id: 'guest',
      name: 'Khach',
      role: UserRole.GUEST,
      familyId: currentFamilyId || null,
      canCreatePost: false,
      canManagePosts: false,
    };
  }
  return {
    id: String(user.id),
    name: user.name || user.username || user.email || 'Nguoi dung',
    role,
    familyId: currentFamilyId || normalizeFamilyId(user.familyId),
    canCreatePost: user.canCreatePost ?? role !== UserRole.MEMBER,
    canManagePosts: user.canManagePosts ?? role !== UserRole.MEMBER,
  };
}

export function isPostManager(actor: any) {
  return Boolean(actor) && (actor.canManagePosts
    || actor.role === UserRole.ADMIN
    || actor.role === UserRole.FAMILY_HEAD);
}

export function canViewInternalPost(actor: any, post: any) {
  if (post.visibility !== 'INTERNAL') { // POST_VISIBILITY.INTERNAL
    return true;
  }
  return Boolean(actor?.familyId && String(actor.familyId) === String(post.familyId));
}

export function canViewPost(actor: any, post: any) {
  if (!actor || !post) return false;
  if (isPostManager(actor) && String(actor.familyId) === String(post.familyId)) return true;
  if (post.status !== 'PUBLISHED') return false; // POST_STATUS.PUBLISHED
  return canViewInternalPost(actor, post);
}

export function canCreatePost(actor: any) {
  return isPostManager(actor) && Boolean(actor.familyId) && actor.canCreatePost;
}

export function canManagePost(actor: any, post: any) {
  if (!actor || !post || actor.role === UserRole.GUEST) return false;
  return isPostManager(actor) && String(actor.familyId) === String(post.familyId);
}

export const canUpdatePost = (actor: any, post: any) => canManagePost(actor, post);
export const canDeletePost = (actor: any, post: any) => canManagePost(actor, post);

export function canPublishPost(actor: any, post: any) {
  return canManagePost(actor, post) && post.status !== 'PUBLISHED';
}

export function canHidePost(actor: any, post: any) {
  return canManagePost(actor, post) && post.status === 'PUBLISHED';
}
