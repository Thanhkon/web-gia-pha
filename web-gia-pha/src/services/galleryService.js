import apiClient from '../utils/apiClient';
import { validateMediaFiles, createUploadDataUrl, getMediaType } from '../utils/mediaUtils';
import { MEDIA_TYPE, ALBUM_STATUS } from '../types/gallery';
import {
  getGalleryActor,
  canManageAlbum,
  canCreateAlbum,
  canUpdateAlbum,
  canDeleteAlbum,
  canUploadMedia,
  canUpdateMedia,
  canDeleteMedia,
  canViewAlbum,
  assertManager,
} from '../utils/permissionUtils';
import {
  toAlbum,
  sortAlbums,
  applyFilters,
  normalizeAlbumPayload,
} from '../utils/galleryUtils';

export {
  validateMediaFiles,
  getGalleryActor,
  canManageAlbum,
  canCreateAlbum,
  canUpdateAlbum,
  canDeleteAlbum,
  canUploadMedia,
  canUpdateMedia,
  canDeleteMedia,
  canViewAlbum,
};

async function fetchAlbum(id) {
  const response = await apiClient.get(`/albums/${id}`);
  return toAlbum(response.data);
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
