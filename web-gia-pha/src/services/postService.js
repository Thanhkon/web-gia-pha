import apiClient from '../utils/apiClient';
import { POST_CONTENT_BLOCK, POST_ROLES, POST_STATUS, POST_VISIBILITY } from '../types/posts';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');

const normalizeRole = (role) => {
  const normalizedRole = String(role || '').toUpperCase();
  if (normalizedRole === 'ADMIN') return POST_ROLES.ADMIN;
  if (normalizedRole === 'CLAN_LEADER') return POST_ROLES.CLAN_LEADER;
  if (normalizedRole === 'FAMILY_HEAD') return POST_ROLES.FAMILY_HEAD;
  if (normalizedRole === 'MEMBER') return POST_ROLES.MEMBER;
  return POST_ROLES.GUEST;
};

const normalizeFamilyId = (value) => String(value || DEFAULT_FAMILY_ID);

const toApiVisibility = (visibility) => (
  visibility === POST_VISIBILITY.PUBLIC ? 'PUBLIC' : 'FAMILY'
);

const fromApiVisibility = (visibility) => (
  visibility === 'PUBLIC' ? POST_VISIBILITY.PUBLIC : POST_VISIBILITY.INTERNAL
);

const toApiStatus = (status) => {
  if (status === POST_STATUS.HIDDEN) return 'ARCHIVED';
  return status || POST_STATUS.DRAFT;
};

const fromApiStatus = (status) => {
  if (status === 'ARCHIVED') return POST_STATUS.HIDDEN;
  if (status === POST_STATUS.PUBLISHED) return POST_STATUS.PUBLISHED;
  return POST_STATUS.DRAFT;
};

const getFamilyIdForApi = (actor) => {
  const familyId = actor?.familyId || DEFAULT_FAMILY_ID;
  return Number(familyId);
};

const createBlockId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `post-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeContentBlocks = (content) => {
  if (typeof content === 'string') {
    const text = content.trim();
    return text
      ? [{ id: createBlockId(), type: POST_CONTENT_BLOCK.PARAGRAPH, text }]
      : [];
  }

  if (!Array.isArray(content)) {
    return [];
  }

  return content.flatMap((block) => {
    if (!block || typeof block !== 'object') return [];
    const id = String(block.id || createBlockId());

    if (block.type === POST_CONTENT_BLOCK.HEADING || block.type === POST_CONTENT_BLOCK.PARAGRAPH) {
      const text = String(block.text || '').trim();
      return text ? [{ id, type: block.type, text }] : [];
    }

    if (block.type === POST_CONTENT_BLOCK.IMAGE) {
      const imageUrl = String(block.imageUrl || '').trim();
      const caption = String(block.caption || '').trim();
      return imageUrl
        ? [{
          id,
          type: POST_CONTENT_BLOCK.IMAGE,
          imageUrl,
          ...(caption ? { caption } : {}),
        }]
        : [];
    }

    return [];
  });
};

const getFirstParagraphText = (content) => (
  normalizeContentBlocks(content).find((block) => block.type === POST_CONTENT_BLOCK.PARAGRAPH)?.text || ''
);

const getAssetUrl = (url) => {
  if (!url || !url.startsWith('/uploads/')) return url || '';

  const baseUrl = apiClient.defaults.baseURL || '';
  const origin = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${origin}${url}`;
};

const toDisplayBlocks = (content) => normalizeContentBlocks(content).map((block) => (
  block.type === POST_CONTENT_BLOCK.IMAGE
    ? { ...block, imageUrl: getAssetUrl(block.imageUrl) }
    : block
));

const toPost = (post) => ({
  id: String(post.id),
  familyId: normalizeFamilyId(post.familyId || post.family?.id),
  title: post.title || '',
  summary: post.summary || getFirstParagraphText(post.content).slice(0, 180),
  content: toDisplayBlocks(post.content),
  category: post.category || 'Khac',
  coverImage: getAssetUrl(post.coverImage || post.thumbnailUrl || ''),
  status: fromApiStatus(post.status),
  visibility: fromApiVisibility(post.visibility),
  author: {
    id: String(post.author?.id || post.authorId || ''),
    name: post.author?.name || post.author?.email || 'Nguoi dung',
    role: post.author?.role || 'Thanh vien',
  },
  publishedAt: post.publishedAt,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  notifiedAt: post.notifiedAt || null,
  hasSentPublishNotification: Boolean(post.notifiedAt || post.publishedAt),
});

const sortPosts = (posts, sortDirection) => {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime();
    return sortDirection === 'oldest' ? aDate - bDate : bDate - aDate;
  });
};

const applyClientFilters = (posts, filters = {}) => {
  const keyword = filters.keyword?.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesKeyword = !keyword || post.title.toLowerCase().includes(keyword);
    return matchesKeyword && (!filters.category || post.category === filters.category);
  });
};

const toPostPayload = (payload) => ({
  title: payload.title,
  summary: payload.summary || null,
  content: normalizeContentBlocks(payload.content),
  category: payload.category || null,
  coverImage: payload.coverImage || null,
  visibility: toApiVisibility(payload.visibility),
  status: toApiStatus(payload.status),
});

export function getPostActor(user, isAuthenticated = Boolean(user), currentFamilyId = null) {
  const role = normalizeRole(user?.role);

  if (!isAuthenticated || !user || !user.id || role === POST_ROLES.GUEST) {
    return {
      id: 'guest',
      name: 'Khach',
      role: POST_ROLES.GUEST,
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
    canCreatePost: user.canCreatePost ?? role !== POST_ROLES.MEMBER,
    canManagePosts: user.canManagePosts ?? role !== POST_ROLES.MEMBER,
  };
}

export function isPostManager(actor) {
  return Boolean(actor) && (actor.canManagePosts
    || actor.role === POST_ROLES.ADMIN
    || actor.role === POST_ROLES.FAMILY_HEAD
    || actor.role === POST_ROLES.CLAN_LEADER);
}

export function canViewInternalPost(actor, post) {
  if (post.visibility !== POST_VISIBILITY.INTERNAL) {
    return true;
  }

  return Boolean(actor?.familyId && actor.familyId === post.familyId);
}

export function canViewPost(actor, post) {
  if (!actor || !post) return false;
  if (isPostManager(actor) && actor.familyId === post.familyId) return true;
  if (post.status !== POST_STATUS.PUBLISHED) return false;
  return canViewInternalPost(actor, post);
}

export function canCreatePost(actor) {
  return isPostManager(actor) && Boolean(actor.familyId) && actor.canCreatePost;
}

export function canUpdatePost(actor, post) {
  return canManagePost(actor, post);
}

export function canDeletePost(actor, post) {
  return canManagePost(actor, post);
}

export function canPublishPost(actor, post) {
  return canManagePost(actor, post) && post.status !== POST_STATUS.PUBLISHED;
}

export function canHidePost(actor, post) {
  return canManagePost(actor, post) && post.status === POST_STATUS.PUBLISHED;
}

function canManagePost(actor, post) {
  if (!actor || !post || actor.role === POST_ROLES.GUEST) return false;
  return isPostManager(actor) && actor.familyId === post.familyId;
}

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

  async uploadPostImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/posts/uploads/images', formData);

    return {
      url: getAssetUrl(response.data.url),
    };
  },

  async updatePost(id, payload, actor) {
    const response = await apiClient.patch(`/posts/${id}`, toPostPayload(payload));
    const post = toPost(response.data);

    if (actor && !canUpdatePost(actor, post)) {
      return post;
    }

    return post;
  },

  async publishPost(id) {
    const response = await apiClient.patch(`/posts/${id}`, { status: POST_STATUS.PUBLISHED });
    return toPost(response.data);
  },

  async hidePost(id) {
    const response = await apiClient.patch(`/posts/${id}`, { status: 'ARCHIVED' });
    return toPost(response.data);
  },

  async deletePost(id) {
    await apiClient.delete(`/posts/${id}`);
    return { success: true };
  },
};
