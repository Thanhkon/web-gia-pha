import apiClient from '../utils/apiClient';
import {
  getPostActor,
  canCreatePost,
  canUpdatePost,
  canDeletePost,
  canPublishPost,
  canHidePost,
  canViewPost,
  isPostManager,
} from '../utils/permissionUtils';
import {
  toApiVisibility,
  toApiStatus,
  getFamilyIdForApi,
  toPost,
  sortPosts,
  applyClientFilters,
  toPostPayload,
} from '../utils/postUtils';

export {
  getPostActor,
  canCreatePost,
  canUpdatePost,
  canDeletePost,
  canPublishPost,
  canHidePost,
  canViewPost,
  isPostManager,
};

export const postService = {
  async getPosts(options = {}, legacyPage, legacyPageSize) {
    const normalizedOptions = options.filters
      ? options
      : {
        filters: options,
        page: legacyPage,
        pageSize: legacyPageSize,
        actor: options.actor,
      };
    const {
      actor = getPostActor(null, false),
      filters = {},
      page = 1,
      pageSize = 6,
    } = normalizedOptions;

    if (!actor?.familyId) {
      return { items: [], total: 0, totalPages: 1, page: 1 };
    }

    const params = {};
    if (isPostManager(actor) && filters.status) params.status = toApiStatus(filters.status);
    if (isPostManager(actor) && filters.visibility) params.visibility = toApiVisibility(filters.visibility);

    const response = await apiClient.get(`/families/${getFamilyIdForApi(actor)}/posts`, { params });
    const visiblePosts = response.data.map(toPost).filter((post) => canViewPost(actor, post));
    const filteredPosts = applyClientFilters(visiblePosts, filters);
    const sortedPosts = sortPosts(filteredPosts, filters.sortDirection);
    const total = sortedPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      items: sortedPosts.slice(start, start + pageSize),
      total,
      totalPages,
      page: safePage,
    };
  },

  async getPostById(id, actor) {
    try {
      const response = await apiClient.get(`/posts/${id}`);
      const post = toPost(response.data);
      return canViewPost(actor || getPostActor(null, false), post) ? post : null;
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  async createPost(payload, actor) {
    if (!canCreatePost(actor)) {
      throw new Error('Ban khong co quyen tao bai viet.');
    }
    const response = await apiClient.post(
      `/families/${getFamilyIdForApi(actor)}/posts`,
      toPostPayload(payload)
    );
    return toPost(response.data);
  },

  async updatePost(id, payload, actor) {
    const currentPost = await this.getPostById(id, actor);
    if (!canUpdatePost(actor, currentPost)) {
      throw new Error('Ban khong co quyen cap nhat bai viet nay.');
    }
    const response = await apiClient.patch(`/posts/${id}`, toPostPayload(payload));
    return toPost(response.data);
  },

  async deletePost(id, actor) {
    const currentPost = await this.getPostById(id, actor);
    if (!canDeletePost(actor, currentPost)) {
      throw new Error('Ban khong co quyen xoa bai viet nay.');
    }
    await apiClient.delete(`/posts/${id}`);
    return { success: true };
  },

  async publishPost(id, actor) {
    const currentPost = await this.getPostById(id, actor);
    if (!canPublishPost(actor, currentPost)) {
      throw new Error('Ban khong co quyen xuat ban bai viet nay.');
    }
    const response = await apiClient.patch(`/posts/${id}`, { status: 'PUBLISHED' });
    return toPost(response.data);
  },

  async hidePost(id, actor) {
    const currentPost = await this.getPostById(id, actor);
    if (!canHidePost(actor, currentPost)) {
      throw new Error('Ban khong co quyen an bai viet nay.');
    }
    const response = await apiClient.patch(`/posts/${id}`, { status: 'ARCHIVED' });
    return toPost(response.data);
  },

  async uploadPostImage(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { url: response.data.url };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Khong the tai anh len');
    }
  },
};
