export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string; // chỉ có với ảnh (transform c_fill)
  duration?: number; // chỉ có với video
}

// Options khi upload, cho phép mỗi module (posts, albums, members...)
// tự quyết định folder + loại resource
export interface UploadOptions {
  folder: string;
  resourceType?: 'image' | 'video' | 'auto';
}

export interface UploadedStorageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
