import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  POST_STATUSES,
  POST_VISIBILITIES,
} from '../entities/post.entity';
import type {
  PostContentBlock,
  PostStatus,
  PostVisibility,
} from '../entities/post.entity';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  slug?: string | null;

  @IsString()
  @IsOptional()
  summary?: string | null;

  @IsOptional()
  content!: PostContentBlock[] | string;

  @IsString()
  @IsOptional()
  category?: string | null;

  @IsIn([...POST_STATUSES])
  @IsOptional()
  status?: PostStatus;

  @IsIn([...POST_VISIBILITIES])
  @IsOptional()
  visibility?: PostVisibility;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string | null;

  @IsString()
  @IsOptional()
  thumbnailPublicId?: string | null;

  @IsString()
  @IsOptional()
  coverImage?: string | null;

  @IsString()
  @IsOptional()
  coverImagePublicId?: string | null;

  @IsString()
  @IsOptional()
  publishedAt?: string | Date | null;
}
