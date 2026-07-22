import { mockPosts } from '../data/mockPosts';
import { POST_ROLE_LABELS, POST_ROLES, POST_STATUS, POST_VISIBILITY } from '../types/posts';

const STORAGE_KEY = 'giapha_mock_posts';
const STORAGE_VERSION_KEY = 'giapha_mock_posts_version';
const STORAGE_VERSION = 'posts-auth-v3';
const DELAY_MS = 280;

let postsStore = readStoredPosts();
const statusRequests = new Set();

function readStoredPosts() {
  try {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && savedVersion === STORAGE_VERSION) {
      const parsedPosts = JSON.parse(saved);
      if (Array.isArray(parsedPosts)) {
        return clonePosts(parsedPosts);
      }
    }
  } catch (error) {
    console.warn('Could not read posts from localStorage:', error);
  }

  return clonePosts(mockPosts);
}

function persistPosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(postsStore));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  } catch (error) {
    console.warn('Could not persist posts to localStorage:', error);
  }
}

function clonePosts(posts) {
  if (!Array.isArray(posts)) {
    return [];
  }

  return posts.filter(Boolean).map((post) => ({
    ...post,
    author: { ...post.author },
  }));
}

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

function slugId() {
  return `post-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

export function getPostActor(user, isAuthenticated = Boolean(user)) {
  const validRoles = Object.values(POST_ROLES);

  if (!isAuthenticated || !user || !validRoles.includes(user.role) || !user.id || !user.familyId) {
    return {
      id: 'guest',
      name: 'Khách',
      role: POST_ROLES.GUEST,
      familyId: null,
      canCreatePost: false,
    };
  }

  return {
    id: user.id,
    name: user.name || 'Người dùng',
    role: user.role,
    familyId: user.familyId,
    canCreatePost: user.canCreatePost ?? true,
    canManagePosts: user.canManagePosts ?? false,
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

  return Boolean(actor.familyId && actor.familyId === post.familyId);
}

export function canViewPost(actor, post) {
  if (!actor || !post) {
    return false;
  }

  const managesFamily = isPostManager(actor) && actor.familyId === post.familyId;

  if (managesFamily) {
    return true;
  }

  if (post.status !== POST_STATUS.PUBLISHED) {
    return false;
  }

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
  if (!actor || !post || actor.role === POST_ROLES.GUEST) {
    return false;
  }

  if (isPostManager(actor)) {
    return actor.familyId === post.familyId;
  }

  return false;
}

function sortPosts(posts, sortDirection) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime();
    return sortDirection === 'oldest' ? aDate - bDate : bDate - aDate;
  });
}

function applyFilters(posts, filters = {}) {
  const keyword = filters.keyword?.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesKeyword = !keyword
      || post.title.toLowerCase().includes(keyword);

    return matchesKeyword
      && (!filters.category || post.category === filters.category)
      && (!filters.status || post.status === filters.status)
      && (!filters.visibility || post.visibility === filters.visibility);
  });
}

export const postService = {
  async getPosts({ filters = {}, page = 1, pageSize = 6, actor } = {}) {
    const currentActor = actor || getPostActor(null, false);
    const safeFilters = isPostManager(currentActor)
      ? filters
      : { ...filters, status: '', visibility: '' };
    const readablePosts = postsStore.filter((post) => canViewPost(currentActor, post));
    const filteredPosts = applyFilters(readablePosts, safeFilters);
    const sortedPosts = sortPosts(filteredPosts, safeFilters.sortDirection);
    const total = sortedPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * pageSize;

    return waitFor({
      items: clonePosts(sortedPosts.slice(start, start + pageSize)),
      total,
      totalPages,
      page: safePage,
    });
  },

  async getPostById(id, actor) {
    const post = postsStore.find((item) => item.id === id);

    if (!post || !canViewPost(actor || getPostActor(null, false), post)) {
      return waitFor(null);
    }

    return waitFor(clonePosts([post])[0]);
  },

  async createPost(payload, actor) {
    if (!canCreatePost(actor)) {
      throw new Error('Bạn không có quyền tạo bài viết.');
    }

    const timestamp = nowIso();
    const status = payload.status === POST_STATUS.PUBLISHED ? POST_STATUS.PUBLISHED : POST_STATUS.DRAFT;
    const shouldNotify = status === POST_STATUS.PUBLISHED;
    const post = {
      id: slugId(),
      familyId: actor.familyId,
      title: payload.title.trim(),
      summary: payload.summary?.trim() || '',
      content: payload.content.trim(),
      category: payload.category,
      coverImage: payload.coverImage?.trim() || '',
      status,
      visibility: payload.visibility || POST_VISIBILITY.INTERNAL,
      author: {
        id: actor.id,
        name: actor.name,
        role: POST_ROLE_LABELS[actor.role] || 'Thành viên',
      },
      publishedAt: status === POST_STATUS.PUBLISHED ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      notifiedAt: shouldNotify ? timestamp : null,
      hasSentPublishNotification: shouldNotify,
    };

    postsStore = [post, ...postsStore];
    persistPosts();

    return waitFor(clonePosts([post])[0]);
  },

  async updatePost(id, payload, actor) {
    const index = postsStore.findIndex((post) => post.id === id);
    const existingPost = postsStore[index];

    if (index === -1 || !canUpdatePost(actor, existingPost)) {
      throw new Error('Bạn không có quyền chỉnh sửa bài viết này.');
    }

    const updatedPost = {
      ...existingPost,
      title: payload.title.trim(),
      summary: payload.summary?.trim() || '',
      content: payload.content.trim(),
      category: payload.category,
      coverImage: payload.coverImage?.trim() || '',
      visibility: payload.visibility,
      updatedAt: nowIso(),
    };

    postsStore = postsStore.map((post) => (post.id === id ? updatedPost : post));
    persistPosts();

    return waitFor(clonePosts([updatedPost])[0]);
  },

  async publishPost(id, actor) {
    return updateStatus(id, POST_STATUS.PUBLISHED, actor);
  },

  async hidePost(id, actor) {
    return updateStatus(id, POST_STATUS.HIDDEN, actor);
  },

  async deletePost(id, actor) {
    const post = postsStore.find((item) => item.id === id);

    if (!post || !canDeletePost(actor, post)) {
      throw new Error('Bạn không có quyền xóa bài viết này.');
    }

    postsStore = postsStore.filter((item) => item.id !== id);
    persistPosts();

    return waitFor({ success: true });
  },
};

async function updateStatus(id, status, actor) {
  const requestKey = `${id}:${status}`;
  if (statusRequests.has(requestKey)) {
    throw new Error('Thao tác trạng thái đang được xử lý. Vui lòng chờ trong giây lát.');
  }

  statusRequests.add(requestKey);
  try {
    const index = postsStore.findIndex((post) => post.id === id);
    const existingPost = postsStore[index];
    const canChange = status === POST_STATUS.PUBLISHED
      ? canPublishPost(actor, existingPost)
      : canHidePost(actor, existingPost);

    if (index === -1 || !canChange) {
      throw new Error('Bạn không có quyền thay đổi trạng thái bài viết này.');
    }

    const timestamp = nowIso();
    const shouldSendNotification = status === POST_STATUS.PUBLISHED
      && existingPost.status === POST_STATUS.DRAFT
      && !existingPost.hasSentPublishNotification;
    const updatedPost = {
      ...existingPost,
      status,
      publishedAt: status === POST_STATUS.PUBLISHED ? (existingPost.publishedAt || timestamp) : existingPost.publishedAt,
      updatedAt: timestamp,
      notifiedAt: shouldSendNotification ? timestamp : existingPost.notifiedAt,
      hasSentPublishNotification: shouldSendNotification ? true : existingPost.hasSentPublishNotification,
    };

    postsStore = postsStore.map((post) => (post.id === id ? updatedPost : post));
    persistPosts();

    return await waitFor(clonePosts([updatedPost])[0]);
  } finally {
    statusRequests.delete(requestKey);
  }
}
