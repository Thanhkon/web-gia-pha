import {
  PostContentBlock,
  PostStatus,
  PostVisibility,
} from '../entities/post.entity';

export class CreatePostDto {
  title: string;
  slug?: string | null;
  summary?: string | null;
  content: PostContentBlock[] | string;
  category?: string | null;
  status?: PostStatus;
  visibility?: PostVisibility;
  thumbnailUrl?: string | null;
  thumbnailPublicId?: string | null;
  coverImage?: string | null;
  coverImagePublicId?: string | null;
  publishedAt?: string | Date | null;
}
