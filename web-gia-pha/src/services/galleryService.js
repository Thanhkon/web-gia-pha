import apiClient from '../utils/apiClient';
import { UserRole } from '../types/auth';
import {
  ALBUM_STATUS,
  ALBUM_VISIBILITY,
  GALLERY_UPLOAD_LIMITS,
  MEDIA_TYPE,
} from '../types/gallery';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');

const normalizeRole = (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === UserRole.FAMILY_HEAD) return UserRole.FAMILY_HEAD;
  if (normalizedRole === UserRole.MEMBER) return UserRole.MEMBER;
  return UserRole.GUEST;
};

const normalizeFamilyId = (value) => String(value || DEFAULT_FAMILY_ID);

const cloneMedia = (media = []) => media.filter(Boolean).map((item) => ({
  id: String(item.id),
  albumId: String(item.albumId || ''),
  type: item.type,
  url: item.url,
  thumbnailUrl: item.thumbnailUrl || item.url,
  fileName: item.fileName,
  description: item.description || '',
  uploadedBy: item.uploadedBy ? {
    id: String(item.uploadedBy.id),
    name: item.uploadedBy.name || item.uploadedBy.email || 'Nguoi dung',
  } : null,
  uploadedAt: item.uploadedAt,
}));

const toAlbum = (album) => {
  const media = cloneMedia(album.media);
  return {
    id: String(album.id),
    familyId: normalizeFamilyId(album.familyId),
    title: album.title || '',
    description: album.description || '',
    coverImage: album.coverImage || '',
    visibility: album.visibility || ALBUM_VISIBILITY.INTERNAL,
    status: album.status || ALBUM_STATUS.VISIBLE,
    createdBy: album.createdBy ? {
      id: String(album.createdBy.id),
      name: album.createdBy.name || album.createdBy.email || 'Nguoi dung',
    } : null,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    notifiedAt: album.notifiedAt,
    media,
    mediaCount: media.length,
    imageCount: media.filter((item) => item.type === MEDIA_TYPE.IMAGE).length,
    videoCount: media.filter((item) => item.type === MEDIA_TYPE.VIDEO).length,
  };
};

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

function normalizeAlbumPayload(payload) {
  const title = payload.title?.trim();
  if (!title) {
    throw new Error('Vui long nhap ten album.');
  }

  return {
    title,
    description: payload.description?.trim() || null,
    coverImage: payload.coverImage?.trim() || null,
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
    reader.onerror = () => reject(new Error(`Khong the doc tep ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Khong the xu ly anh ${file.name}.`));
    };
    image.src = objectUrl;
  });
}

function drawImageToCanvas(image, maxDimension) {
  const longestSide = Math.max(image.width, image.height);
  const ratio = longestSide > maxDimension ? maxDimension / longestSide : 1;
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Trinh duyet khong ho tro nen anh.');
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas;
}

async function createUploadDataUrl(file) {
  const mediaType = getMediaType(file);

  if (mediaType !== MEDIA_TYPE.IMAGE) {
    throw new Error(`${file.name}: video can API upload file rieng, hien chua ho tro gui qua JSON.`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  if (originalDataUrl.length <= GALLERY_UPLOAD_LIMITS.apiJsonPayloadBudget) {
    return originalDataUrl;
  }

  const image = await loadImage(file);
  const dimensions = [
    GALLERY_UPLOAD_LIMITS.imageMaxDimension,
    960,
    720,
    540,
    420,
    320,
  ];
  const qualities = [0.82, 0.72, 0.62, 0.52, 0.42, 0.34];

  for (const maxDimension of dimensions) {
    const canvas = drawImageToCanvas(image, maxDimension);

    for (const quality of qualities) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      if (dataUrl.length <= GALLERY_UPLOAD_LIMITS.apiJsonPayloadBudget) {
        return dataUrl;
      }
    }
  }

  throw new Error(`${file.name}: anh qua lon de gui bang API hien tai. Hay chon anh nho hon hoac can backend upload file that.`);
}

async function fetchAlbum(id) {
  const response = await apiClient.get(`/albums/${id}`);
  return toAlbum(response.data);
}

function assertManager(actor, album, message) {
  if (!canManageAlbum(actor, album)) {
    throw new Error(message);
  }
}

export function validateMediaFiles(files) {
  const items = Array.from(files || []);

  if (items.length === 0) {
    return ['Vui long chon it nhat mot tep anh.'];
  }

  if (items.length > GALLERY_UPLOAD_LIMITS.maxFilesPerUpload) {
    return [`Chi duoc tai toi da ${GALLERY_UPLOAD_LIMITS.maxFilesPerUpload} tep trong mot lan.`];
  }

  return items.flatMap((file) => {
    const mediaType = getMediaType(file);
    if (!mediaType) {
      return [`${file.name}: dinh dang khong hop le. Chi ho tro JPG, JPEG, PNG, WEBP.`];
    }

    if (mediaType === MEDIA_TYPE.VIDEO) {
      return [`${file.name}: video chua ho tro tai len voi API hien tai. Can backend upload multipart/storage truoc.`];
    }

    const maxSize = GALLERY_UPLOAD_LIMITS.maxImageSize;

    if (file.size > maxSize) {
      return [`${file.name}: dung luong ${bytesToMb(file.size)} MB vuot gioi han 10 MB.`];
    }

    return [];
  });
}

export function getGalleryActor(user, isAuthenticated = Boolean(user)) {
  const role = normalizeRole(user?.role);

  if (!isAuthenticated || !user || !user.id || role === UserRole.GUEST) {
    return null;
  }

  return {
    id: String(user.id),
    name: user.name || user.username || user.email || 'Nguoi dung',
    role,
    familyId: normalizeFamilyId(user.familyId),
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
  if (!album) return false;
  if (canManageAlbum(actor, album)) return true;
  if (album.status !== ALBUM_STATUS.VISIBLE) return false;
  if (album.visibility === ALBUM_VISIBILITY.PUBLIC) return true;

  return Boolean(
    actor
      && actor.role === UserRole.MEMBER
      && actor.memberId
      && actor.familyId === album.familyId
  );
}

export const galleryService = {
  async getAlbums({ actor = null, filters = {} } = {}) {
    if (!actor?.familyId) {
      return [];
    }

    const response = await apiClient.get(`/families/${Number(actor.familyId)}/albums`, {
      params: {
        status: canManageAlbum(actor) && filters.status ? filters.status : undefined,
        visibility: filters.visibility || undefined,
      },
    });
    const albumSummaries = response.data.map(toAlbum);
    const albums = await Promise.all(albumSummaries.map((album) => fetchAlbum(album.id)));
    const visibleAlbums = albums.filter((album) => canViewAlbum(actor, album));

    return sortAlbums(applyFilters(visibleAlbums, filters, actor));
  },

  async getAlbumById(id, actor = null) {
    const album = await fetchAlbum(id);
    if (!canViewAlbum(actor, album)) {
      throw new Error('Khong tim thay album hoac ban khong co quyen xem.');
    }

    return album;
  },

  async createAlbum(payload, actor) {
    if (!canCreateAlbum(actor)) {
      throw new Error('Ban khong co quyen tao album.');
    }

    const response = await apiClient.post(
      `/families/${Number(actor.familyId)}/albums`,
      normalizeAlbumPayload(payload)
    );
    return toAlbum(response.data);
  },

  async updateAlbum(id, payload, actor) {
    const currentAlbum = await fetchAlbum(id);
    assertManager(actor, currentAlbum, 'Ban khong co quyen cap nhat album nay.');

    const response = await apiClient.patch(`/albums/${id}`, normalizeAlbumPayload(payload));
    return toAlbum({ ...response.data, media: currentAlbum.media });
  },

  async deleteAlbum(id, actor) {
    const album = await fetchAlbum(id);
    assertManager(actor, album, 'Ban khong co quyen xoa album nay.');

    await apiClient.delete(`/albums/${id}`);
    return { success: true };
  },

  async toggleAlbumStatus(id, actor) {
    const album = await fetchAlbum(id);
    assertManager(actor, album, 'Ban khong co quyen thay doi trang thai album nay.');

    const nextStatus = album.status === ALBUM_STATUS.VISIBLE ? ALBUM_STATUS.HIDDEN : ALBUM_STATUS.VISIBLE;
    const response = await apiClient.patch(`/albums/${id}`, { status: nextStatus });
    return toAlbum({ ...response.data, media: album.media });
  },

  async uploadMedia(albumId, files, actor, descriptions = []) {
    const album = await fetchAlbum(albumId);
    assertManager(actor, album, 'Ban khong co quyen tai tep len album nay.');

    const errors = validateMediaFiles(files);
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    await Promise.all(Array.from(files).map(async (file, index) => {
      const type = getMediaType(file);
      const url = await createUploadDataUrl(file);
      await apiClient.post(`/albums/${albumId}/media`, {
        type,
        url,
        fileName: file.name,
        description: descriptions[index]?.trim() || null,
      });
    }));

    return fetchAlbum(albumId);
  },

  async updateMedia(albumId, mediaId, payload, actor) {
    const album = await fetchAlbum(albumId);
    assertManager(actor, album, 'Ban khong co quyen cap nhat tep nay.');

    await apiClient.patch(`/albums/${albumId}/media/${mediaId}`, {
      description: payload.description?.trim() || null,
    });
    return fetchAlbum(albumId);
  },

  async deleteMedia(albumId, mediaId, actor) {
    const album = await fetchAlbum(albumId);
    assertManager(actor, album, 'Ban khong co quyen xoa tep nay.');

    await apiClient.delete(`/albums/${albumId}/media/${mediaId}`);
    return fetchAlbum(albumId);
  },
};
