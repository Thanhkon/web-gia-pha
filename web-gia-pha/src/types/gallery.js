export const ALBUM_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
};

export const ALBUM_STATUS = {
  VISIBLE: 'VISIBLE',
  HIDDEN: 'HIDDEN',
};

export const MEDIA_TYPE = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
};

export const ALBUM_VISIBILITY_LABELS = {
  [ALBUM_VISIBILITY.PUBLIC]: 'Công khai',
  [ALBUM_VISIBILITY.INTERNAL]: 'Nội bộ',
};

export const ALBUM_STATUS_LABELS = {
  [ALBUM_STATUS.VISIBLE]: 'Đã hiển thị',
  [ALBUM_STATUS.HIDDEN]: 'Đã ẩn',
};

export const MEDIA_TYPE_LABELS = {
  [MEDIA_TYPE.IMAGE]: 'Ảnh',
  [MEDIA_TYPE.VIDEO]: 'Video',
};

export const GALLERY_UPLOAD_LIMITS = {
  maxFilesPerUpload: 20,
  maxImageSize: 10 * 1024 * 1024,
  apiJsonPayloadBudget: 75 * 1024,
  imageMaxDimension: 1280,
  imageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  videoTypes: ['video/mp4', 'video/webm'],
};
