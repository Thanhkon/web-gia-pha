import { ALBUM_STATUS, ALBUM_VISIBILITY, MEDIA_TYPE } from '../types/gallery';
import { canManageAlbum } from './permissionUtils';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');
const normalizeFamilyId = (value) => String(value || DEFAULT_FAMILY_ID);

export const cloneMedia = (media = []) => media.filter(Boolean).map((item) => ({
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

export const toAlbum = (album) => {
  const media = cloneMedia(album.media);
  return {
    id: String(album.id),
    familyId: normalizeFamilyId(album.familyId || album.family?.id),
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

export function sortAlbums(albums) {
  return [...albums].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function applyFilters(albums, filters = {}, actor = null) {
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

export function normalizeAlbumPayload(payload) {
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
