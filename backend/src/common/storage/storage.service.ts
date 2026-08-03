import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';
import { CLOUDINARY } from './storage.constants';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from './storage.constants';
import {
  UploadOptions,
  UploadResult,
  UploadedStorageFile,
} from './upload-result.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  // Inject Cloudinary instance đã được config sẵn (từ StorageProvider).
  // Chỉ dùng để bảo đảm module load đúng thứ tự (Cloudinary đã config
  // trước khi Service này được dùng) — bản thân cloudinary SDK là global
  // instance nên không cần gán lại vào field riêng.
  constructor(
    @Inject(CLOUDINARY) private readonly _cloudinaryConfig: unknown,
  ) {}

  /**
   * Validate loại file + dung lượng trước khi upload.
   * Ném BadRequestException nếu không hợp lệ.
   */
  private validateFile(file: UploadedStorageFile): 'image' | 'video' {
    const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype);
    const isVideo = ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype);

    if (!isImage && !isVideo) {
      throw new BadRequestException(
        `Định dạng file không được hỗ trợ: ${file.mimetype}`,
      );
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Dung lượng file vượt quá giới hạn cho phép (${maxSize / (1024 * 1024)}MB)`,
      );
    }

    return isImage ? 'image' : 'video';
  }

  /**
   * Upload 1 file (ảnh hoặc video) lên Cloudinary theo folder chỉ định.
   * Các module (posts, albums, members...) chỉ cần gọi hàm này,
   * không cần biết gì về Cloudinary SDK bên dưới.
   */
  async upload(
    file: UploadedStorageFile,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const detectedType = this.validateFile(file);
    const resourceType = options.resourceType === 'auto'
      ? detectedType
      : (options.resourceType ?? detectedType);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          resource_type: resourceType === 'video' ? 'video' : 'image',
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            this.logger.error('Cloudinary upload thất bại', error);
            return reject(
              new BadRequestException('Upload file thất bại, vui lòng thử lại'),
            );
          }
          resolve(uploadResult);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    return this.mapToUploadResult(result);
  }

  /**
   * Xóa file trên Cloudinary theo publicId.
   * Dùng khi xóa vĩnh viễn (hard delete) hoặc dọn rác định kỳ,
   * KHÔNG gọi hàm này khi chỉ soft-delete (set deletedAt).
   */
  async delete(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } catch (error) {
      this.logger.error(`Xóa file Cloudinary thất bại: ${publicId}`, error);
      // Không throw để tránh chặn luồng chính (ví dụ xóa post) chỉ vì
      // xóa file trên Cloudinary lỗi - tùy nghiệp vụ bạn có thể đổi lại.
    }
  }

  private mapToUploadResult(result: UploadApiResponse): UploadResult {
    const isVideo = result.resource_type === 'video';

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type as UploadResult['resourceType'],
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: isVideo ? result.duration : undefined,
      thumbnailUrl: !isVideo
        ? cloudinary.url(result.public_id, {
            transformation: [{ width: 600, height: 400, crop: 'fill' }],
          })
        : undefined,
    };
  }
}
