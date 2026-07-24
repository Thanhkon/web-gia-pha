import { PostStatus, PostVisibility } from '../entities/post.entity';

export class CreatePostDto {
  title: string;
  slug?: string | null;
  summary?: string | null;
  content: string;
  category?: string | null;
  status?: PostStatus;
  visibility?: PostVisibility;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  publishedAt?: string | Date | null;
}
