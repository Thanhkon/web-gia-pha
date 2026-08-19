import { POST_CONTENT_BLOCK, POST_STATUS, POST_VISIBILITY } from '../types/posts';
import apiClient from './apiClient';

const DEFAULT_FAMILY_ID = String(import.meta.env.VITE_DEFAULT_FAMILY_ID || '1');
const normalizeFamilyId = (value) => String(value || DEFAULT_FAMILY_ID);

export const toApiVisibility = (visibility) => (
  visibility === POST_VISIBILITY.PUBLIC ? 'PUBLIC' : 'FAMILY'
);

export const fromApiVisibility = (visibility) => (
  visibility === 'PUBLIC' ? POST_VISIBILITY.PUBLIC : POST_VISIBILITY.INTERNAL
);

export const toApiStatus = (status) => {
  if (status === POST_STATUS.HIDDEN) return 'ARCHIVED';
  return status || POST_STATUS.DRAFT;
};

export const fromApiStatus = (status) => {
  if (status === 'ARCHIVED') return POST_STATUS.HIDDEN;
  if (status === POST_STATUS.PUBLISHED) return POST_STATUS.PUBLISHED;
  return POST_STATUS.DRAFT;
};

export const getFamilyIdForApi = (actor) => {
  const familyId = actor?.familyId || DEFAULT_FAMILY_ID;
  return Number(familyId);
};

export const createBlockId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `post-block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const normalizeContentBlocks = (content) => {
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

export const getFirstParagraphText = (content) => (
  normalizeContentBlocks(content).find((block) => block.type === POST_CONTENT_BLOCK.PARAGRAPH)?.text || ''
);

export const getAssetUrl = (url) => {
  if (!url || !url.startsWith('/uploads/')) return url || '';

  const baseUrl = apiClient.defaults.baseURL || '';
  const origin = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${origin}${url}`;
};

export const toDisplayBlocks = (content) => normalizeContentBlocks(content).map((block) => (
  block.type === POST_CONTENT_BLOCK.IMAGE
    ? { ...block, imageUrl: getAssetUrl(block.imageUrl) }
    : block
));

export const toPost = (post) => ({
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

export const sortPosts = (posts, sortDirection) => {
  return [...posts].sort((a, b) => {
    const aDate = new Date(a.publishedAt || a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.publishedAt || b.updatedAt || b.createdAt).getTime();
    return sortDirection === 'oldest' ? aDate - bDate : bDate - aDate;
  });
};

export const applyClientFilters = (posts, filters = {}) => {
  const keyword = filters.keyword?.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesKeyword = !keyword || post.title.toLowerCase().includes(keyword);
    return matchesKeyword && (!filters.category || post.category === filters.category);
  });
};

export const toPostPayload = (payload) => ({
  title: payload.title,
  summary: payload.summary || null,
  content: normalizeContentBlocks(payload.content),
  category: payload.category || null,
  coverImage: payload.coverImage || null,
  visibility: toApiVisibility(payload.visibility),
  status: toApiStatus(payload.status),
});
