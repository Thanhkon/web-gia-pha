import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '../common/storage/storage.constants';

export const multerOptions = (allowVideo = false) => {
  return {
    limits: {
      fileSize: allowVideo
        ? Math.max(MAX_VIDEO_SIZE, MAX_IMAGE_SIZE)
        : MAX_IMAGE_SIZE,
    },
    fileFilter: (
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const isImage = ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype);
      const isVideo =
        allowVideo && ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype);

      if (isImage || isVideo) {
        callback(null, true);
      } else {
        callback(
          new BadRequestException(
            allowVideo
              ? 'Chỉ cho phép định dạng ảnh hoặc video'
              : 'Chỉ cho phép định dạng ảnh',
          ),
          false,
        );
      }
    },
    storage: memoryStorage(),
  };
};
