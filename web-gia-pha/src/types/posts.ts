export const POST_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  HIDDEN: 'HIDDEN',
};

export const POST_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
};

export const POST_ROLES = {
  ADMIN: 'ADMIN',
  FAMILY_HEAD: 'FAMILY_HEAD',
  CLAN_LEADER: 'CLAN_LEADER',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
};

export const POST_ROLE_LABELS = {
  [POST_ROLES.ADMIN]: 'Quản trị viên',
  [POST_ROLES.FAMILY_HEAD]: 'Trưởng họ',
  [POST_ROLES.CLAN_LEADER]: 'Trưởng họ',
  [POST_ROLES.MEMBER]: 'Thành viên',
  [POST_ROLES.GUEST]: 'Khách',
};

export const POST_CATEGORIES = [
  'Tin dòng họ',
  'Hoạt động dòng họ',
  'Lịch sử và truyền thống',
  'Văn hóa dòng họ',
  'Gương sáng',
  'Khuyến học',
  'Thông báo',
  'Khác',
];

export const POST_STATUS_LABELS = {
  [POST_STATUS.DRAFT]: 'Bản nháp',
  [POST_STATUS.PUBLISHED]: 'Đã đăng',
  [POST_STATUS.HIDDEN]: 'Đã ẩn',
};

export const POST_VISIBILITY_LABELS = {
  [POST_VISIBILITY.PUBLIC]: 'Công khai',
  [POST_VISIBILITY.INTERNAL]: 'Nội bộ',
};

/**
 * @typedef {'DRAFT' | 'PUBLISHED' | 'HIDDEN'} PostStatus
 * @typedef {'PUBLIC' | 'INTERNAL'} PostVisibility
 * @typedef {'ADMIN' | 'FAMILY_HEAD' | 'CLAN_LEADER' | 'MEMBER' | 'GUEST'} PostRole
 *
 * @typedef {Object} PostAuthor
 * @property {string} id
 * @property {string} name
 * @property {string} role
 *
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} familyId
 * @property {string} title
 * @property {string} summary
 * @property {string} content
 * @property {string} category
 * @property {string} coverImage
 * @property {PostStatus} status
 * @property {PostVisibility} visibility
 * @property {PostAuthor} author
 * @property {string | null} publishedAt
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string | null} notifiedAt
 * @property {boolean} hasSentPublishNotification
 *
 * @typedef {Object} CreatePostDto
 * @property {string} title
 * @property {string} summary
 * @property {string} content
 * @property {string} category
 * @property {string} coverImage
 * @property {PostVisibility} visibility
 * @property {PostStatus} status
 *
 * @typedef {Object} UpdatePostDto
 * @property {string} title
 * @property {string} summary
 * @property {string} content
 * @property {string} category
 * @property {string} coverImage
 * @property {PostVisibility} visibility
 *
 * @typedef {Object} PostQuery
 * @property {string=} keyword
 * @property {string=} category
 * @property {PostStatus=} status
 * @property {PostVisibility=} visibility
 * @property {'newest' | 'oldest'=} sortDirection
 *
 * @typedef {Object} PaginatedPosts
 * @property {Post[]} items
 * @property {number} total
 * @property {number} totalPages
 * @property {number} page
 */
