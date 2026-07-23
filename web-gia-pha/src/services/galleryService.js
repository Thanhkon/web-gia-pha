import { mockGalleryAlbums } from '../data/mockGallery';
import { UserRole } from '../types/auth';
import {
  ALBUM_STATUS,
  ALBUM_VISIBILITY,
  GALLERY_UPLOAD_LIMITS,
  MEDIA_TYPE,
} from '../types/gallery';

const STORAGE_KEY = 'giapha_mock_gallery_albums';
const STORAGE_VERSION_KEY = 'giapha_mock_gallery_version';
const STORAGE_VERSION = 'gallery-auth-v1';
const DELAY_MS = 260;

let albumStore = readStoredAlbums();

function waitFor(value) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), DELAY_MS);
  });
}

function nowIso() {
  const date = new Date();
  const offsetMs = 7 * 60 * 60 * 1000;
  return new Date(date.getTime() + offsetMs).toISOString().replace('Z', '+07:00');
}

function slugId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function cloneMedia(media = []) {
  return media.filter(Boolean).map((item) => ({
    ...item,
    uploadedBy: item.uploadedBy ? { ...item.uploadedBy } : null,
  }));
}

function cloneAlbums(albums = []) {
  return albums.filter(Boolean).map((album) => ({
    ...album,
    createdBy: album.createdBy ? { ...album.createdBy } : null,
    media: cloneMedia(album.media),
  }));
}

function readStoredAlbums() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved && savedVersion === STORAGE_VERSION) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return cloneAlbums(parsed);
      }
    }
  } catch (error) {
    console.warn('Could not read gallery albums from localStorage:', error);
  }

  return cloneAlbums(mockGalleryAlbums);
}

function persistAlbums() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(albumStore));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch (error) {
    console.warn('Could not persist gallery albums to localStorage:', error);
  }
}

export function getGalleryActor(user, isAuthenticated = Boolean(user)) {
  if (!isAuthenticated || !user || !user.id || !user.familyId || !user.role) {
    return null;
  }

  if (![UserRole.FAMILY_HEAD, UserRole.MEMBER].includes(user.role)) {
    return null;
  }

  return {
    id: user.id,
    name: user.name || 'Người dùng',
    role: user.role,
    familyId: user.familyId,
    memberId: user.memberId || null,
  };
}

export function canManageAlbum(actor, album) {
  if (!actor || actor.role !== UserRole.FAMILY_HEAD || !actor.familyId) {
    return false;
  }

  return album ? album.familyId === actor.familyId : true;
}

export const canCreateAlbum = (actor) => canManageAlbum(actor);
export const canUpdateAlbum = canManageAlbum;
export const canDeleteAlbum = canManageAlbum;
export const canUploadMedia = canManageAlbum;
export const canUpdateMedia = canManageAlbum;
export const canDeleteMedia = canManageAlbum;

export function canViewAlbum(actor, album) {
  if (!album) {
    return false;
  }

  if (canManageAlbum(actor, album)) {
    return true;
  }

  if (album.status !== ALBUM_STATUS.VISIBLE) {
    return false;
  }

  if (album.visibility === ALBUM_VISIBILITY.PUBLIC) {
    return true;
  }

  return Boolean(
    actor
      && actor.role === UserRole.MEMBER
      && actor.memberId
      && actor.familyId === album.familyId
  );
}

function sortAlbums(albums) {
  return [...albums].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function applyFilters(albums, filters = {}, actor = null) {
  const keyword = filters.keyword?.trim().toLowerCase();
  const canFilterManagementFields = canManageAlbum(actor);

  return albums.filter((album) => {
    const matchesKeyword = !keyword
      || album.title.toLowerCase().includes(keyword)
      || album.description.toLowerCase().includes(keyword);

    return matchesKeyword
      && (!canFilterManagementFields || !filters.status || album.status === filters.status)
      && (!filters.visibility || album.visibility === filters.visibility);
  });
}

function assertManager(actor, album, message) {
  if (!canManageAlbum(actor, album)) {
    throw new Error(message);
  }
}

function normalizeAlbumPayload(payload) {
  const title = payload.title?.trim();
  if (!title) {
    throw new Error('Vui lòng nhập tên album.');
  }

  return {
    title,
    description: payload.description?.trim() || '',
    coverImage: payload.coverImage?.trim() || '',
    visibility: payload.visibility === ALBUM_VISIBILITY.PUBLIC
      ? ALBUM_VISIBILITY.PUBLIC
      : ALBUM_VISIBILITY.INTERNAL,
    status: payload.status === ALBUM_STATUS.HIDDEN ? ALBUM_STATUS.HIDDEN : ALBUM_STATUS.VISIBLE,
  };
}

function getMediaType(file) {
  if (GALLERY_UPLOAD_LIMITS.imageTypes.includes(file.type)) return MEDIA_TYPE.IMAGE;
  if (GALLERY_UPLOAD_LIMITS.videoTypes.includes(file.type)) return MEDIA_TYPE.VIDEO;
  return null;
}

function bytesToMb(size) {
  return Math.round((size / 1024 / 1024) * 10) / 10;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không thể đọc tệp ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export function validateMediaFiles(files) {
  const items = Array.from(files || []);

  if (items.length === 0) {
    return ['Vui lòng chọn ít nhất một tệp ảnh hoặc video.'];
  }

  if (items.length > GALLERY_UPLOAD_LIMITS.maxFilesPerUpload) {
    return [`Chỉ được tải tối đa ${GALLERY_UPLOAD_LIMITS.maxFilesPerUpload} tệp trong một lần.`];
  }

  return items.flatMap((file) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      return [`${file.name}: định dạng không hợp lệ. Chỉ hỗ trợ JPG, JPEG, PNG, WEBP, MP4, WEBM.`];
    }

    const maxSize = mediaType === MEDIA_TYPE.IMAGE
      ? GALLERY_UPLOAD_LIMITS.maxImageSize
      : GALLERY_UPLOAD_LIMITS.maxVideoSize;

    if (file.size > maxSize) {
      return [`${file.name}: dung lượng ${bytesToMb(file.size)} MB vượt giới hạn ${mediaType === MEDIA_TYPE.IMAGE ? '10 MB' : '100 MB'}.`];
    }

    return [];
  });
}

export const galleryService = {
  async getAlbums({ actor = null, filters = {} } = {}) {
    const visibleAlbums = albumStore.filter((album) => canViewAlbum(actor, album));
    return waitFor(sortAlbums(applyFilters(visibleAlbums, filters, actor)).map((album) => ({
      ...cloneAlbums([album])[0],
      mediaCount: album.media.length,
      imageCount: album.media.filter((item) => item.type === MEDIA_TYPE.IMAGE).length,
      videoCount: album.media.filter((item) => item.type === MEDIA_TYPE.VIDEO).length,
    })));
  },

  async getAlbumById(id, actor = null) {
    const album = albumStore.find((item) => item.id === id);
    if (!album || !canViewAlbum(actor, album)) {
      throw new Error('Không tìm thấy album hoặc bạn không có quyền xem.');
    }

    return waitFor(cloneAlbums([album])[0]);
  },

  async createAlbum(payload, actor) {
    if (!canCreateAlbum(actor)) {
      throw new Error('Bạn không có quyền tạo album.');
    }

    const data = normalizeAlbumPayload(payload);
    const timestamp = nowIso();
    const album = {
      id: slugId('album'),
      familyId: actor.familyId,
      ...data,
      createdBy: {
        id: actor.id,
        name: actor.name,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
      notifiedAt: data.status === ALBUM_STATUS.VISIBLE ? timestamp : null,
      media: [],
    };

    albumStore = [album, ...albumStore];
    persistAlbums();
    return waitFor(cloneAlbums([album])[0]);
  },

  async updateAlbum(id, payload, actor) {
    const index = albumStore.findIndex((album) => album.id === id);
    const existing = albumStore[index];
    assertManager(actor, existing, 'Bạn không có quyền cập nhật album này.');

    const data = normalizeAlbumPayload(payload);
    const shouldNotify = existing.status === ALBUM_STATUS.HIDDEN && data.status === ALBUM_STATUS.VISIBLE;
    const updatedAlbum = {
      ...existing,
      ...data,
      media: cloneMedia(existing.media),
      updatedAt: nowIso(),
      notifiedAt: shouldNotify ? nowIso() : existing.notifiedAt,
    };

    albumStore = albumStore.map((album) => (album.id === id ? updatedAlbum : album));
    persistAlbums();
    return waitFor(cloneAlbums([updatedAlbum])[0]);
  },

  async deleteAlbum(id, actor) {
    const album = albumStore.find((item) => item.id === id);
    assertManager(actor, album, 'Bạn không có quyền xóa album này.');

    albumStore = albumStore.filter((item) => item.id !== id);
    persistAlbums();
    return waitFor({ success: true });
  },

  async toggleAlbumStatus(id, actor) {
    const album = albumStore.find((item) => item.id === id);
    assertManager(actor, album, 'Bạn không có quyền thay đổi trạng thái album này.');

    const nextStatus = album.status === ALBUM_STATUS.VISIBLE ? ALBUM_STATUS.HIDDEN : ALBUM_STATUS.VISIBLE;
    const timestamp = nowIso();
    const updatedAlbum = {
      ...album,
      status: nextStatus,
      updatedAt: timestamp,
      notifiedAt: nextStatus === ALBUM_STATUS.VISIBLE ? (album.notifiedAt || timestamp) : album.notifiedAt,
    };

    albumStore = albumStore.map((item) => (item.id === id ? updatedAlbum : item));
    persistAlbums();
    return waitFor(cloneAlbums([updatedAlbum])[0]);
  },

  async uploadMedia(albumId, files, actor, descriptions = []) {
    const album = albumStore.find((item) => item.id === albumId);
    assertManager(actor, album, 'Bạn không có quyền tải tệp lên album này.');

    const errors = validateMediaFiles(files);
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    const timestamp = nowIso();
    const uploadedMedia = await Promise.all(Array.from(files).map(async (file, index) => {
      const type = getMediaType(file);
      const url = await readFileAsDataUrl(file);
      return {
        id: slugId('media'),
        type,
        url,
        thumbnailUrl: url,
        fileName: file.name,
        description: descriptions[index]?.trim() || '',
        uploadedBy: {
          id: actor.id,
          name: actor.name,
        },
        uploadedAt: timestamp,
      };
    }));

    const updatedAlbum = {
      ...album,
      media: [...album.media, ...uploadedMedia],
      updatedAt: timestamp,
    };

    albumStore = albumStore.map((item) => (item.id === albumId ? updatedAlbum : item));
    persistAlbums();
    return waitFor(cloneAlbums([updatedAlbum])[0]);
  },

  async updateMedia(albumId, mediaId, payload, actor) {
    const album = albumStore.find((item) => item.id === albumId);
    assertManager(actor, album, 'Bạn không có quyền cập nhật tệp này.');

    const media = album.media.find((item) => item.id === mediaId);
    if (!media) {
      throw new Error('Không tìm thấy ảnh hoặc video cần cập nhật.');
    }

    const updatedAlbum = {
      ...album,
      media: album.media.map((item) => (
        item.id === mediaId ? { ...item, description: payload.description?.trim() || '' } : item
      )),
      updatedAt: nowIso(),
    };

    albumStore = albumStore.map((item) => (item.id === albumId ? updatedAlbum : item));
    persistAlbums();
    return waitFor(cloneAlbums([updatedAlbum])[0]);
  },

  async deleteMedia(albumId, mediaId, actor) {
    const album = albumStore.find((item) => item.id === albumId);
    assertManager(actor, album, 'Bạn không có quyền xóa tệp này.');

    const exists = album.media.some((item) => item.id === mediaId);
    if (!exists) {
      throw new Error('Không tìm thấy ảnh hoặc video cần xóa.');
    }

    const updatedAlbum = {
      ...album,
      media: album.media.filter((item) => item.id !== mediaId),
      updatedAt: nowIso(),
    };

    albumStore = albumStore.map((item) => (item.id === albumId ? updatedAlbum : item));
    persistAlbums();
    return waitFor(cloneAlbums([updatedAlbum])[0]);
  },
};
