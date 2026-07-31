import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { IsNull, Not, Repository } from 'typeorm';
import { Family } from '../members/entities/family.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  Post,
  PostContentBlock,
  POST_STATUSES,
  POST_VISIBILITIES,
  PostStatus,
  PostVisibility,
} from './entities/post.entity';

type PostUploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

const POST_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const POST_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Family)
    private readonly familiesRepository: Repository<Family>,
  ) {}

  async create(familyId: number, authorId: number, createPostDto: CreatePostDto) {
    await this.ensureFamilyExists(familyId);
    this.validateCreatePayload(createPostDto);

    const status = this.normalizeStatus(createPostDto.status ?? 'DRAFT');
    const post = this.postsRepository.create({
      ...this.normalizePostInput(createPostDto),
      familyId,
      authorId,
      status,
      visibility: this.normalizeVisibility(createPostDto.visibility ?? 'FAMILY'),
      slug: this.normalizeSlug(createPostDto.slug) || this.slugify(createPostDto.title),
      publishedAt:
        status === 'PUBLISHED'
          ? (this.normalizeDate(createPostDto.publishedAt) ?? new Date())
          : (this.normalizeDate(createPostDto.publishedAt) ?? null),
    });

    return this.postsRepository.save(post);
  }

  async findByFamily(
    familyId: number,
    filters?: {
      status?: string;
      visibility?: string;
      includeDeleted?: boolean;
    },
  ) {
    await this.ensureFamilyExists(familyId);

    return this.postsRepository.find({
      where: {
        familyId,
        ...(filters?.status
          ? { status: this.normalizeStatus(filters.status) }
          : {}),
        ...(filters?.visibility
          ? { visibility: this.normalizeVisibility(filters.visibility) }
          : {}),
        ...(filters?.includeDeleted ? {} : { deletedAt: IsNull() }),
      },
      relations: { author: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: { family: true, author: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return post;
  }

  async uploadImage(file?: PostUploadFile) {
    if (!file) {
      throw new BadRequestException('image is required');
    }

    if (!POST_IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Only JPG, PNG and WEBP images are allowed');
    }

    if (file.size > POST_IMAGE_MAX_SIZE) {
      throw new BadRequestException('Image must be smaller than 5 MB');
    }

    const extension = this.getImageExtension(file);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const uploadDir = join(process.cwd(), 'uploads', 'posts');

    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, fileName), file.buffer);

    return {
      url: `/uploads/posts/${fileName}`,
    };
  }

  async update(id: number, authorId: number, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException('You are not allowed to update this post');
    }

    const nextStatus = updatePostDto.status
      ? this.normalizeStatus(updatePostDto.status)
      : post.status;

    this.postsRepository.merge(post, this.normalizePostInput(updatePostDto));

    if (updatePostDto.title !== undefined && !updatePostDto.slug) {
      post.slug = this.slugify(updatePostDto.title);
    }

    if (updatePostDto.slug !== undefined) {
      post.slug = this.normalizeSlug(updatePostDto.slug) ?? null;
    }

    post.status = nextStatus;

    if (updatePostDto.visibility !== undefined) {
      post.visibility = this.normalizeVisibility(updatePostDto.visibility);
    }

    if (updatePostDto.publishedAt !== undefined) {
      post.publishedAt = this.normalizeDate(updatePostDto.publishedAt) ?? null;
    } else if (post.status === 'PUBLISHED' && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    if (post.status !== 'PUBLISHED' && updatePostDto.status !== undefined) {
      post.publishedAt = null;
    }

    return this.postsRepository.save(post);
  }

  async remove(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    post.deletedAt = new Date();
    await this.postsRepository.save(post);

    return { deleted: true, id };
  }

  async restore(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
    });

    if (!post) {
      throw new NotFoundException(`Deleted post ${id} not found`);
    }

    post.deletedAt = null;
    return this.postsRepository.save(post);
  }

  private async ensureFamilyExists(familyId: number) {
    const exists = await this.familiesRepository.exists({ where: { id: familyId } });
    if (!exists) {
      throw new NotFoundException(`Family ${familyId} not found`);
    }
  }

  private validateCreatePayload(dto: CreatePostDto) {
    if (!dto.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (this.normalizeContentBlocks(dto.content).length === 0) {
      throw new BadRequestException('content is required');
    }
  }

  private normalizePostInput(dto: CreatePostDto | UpdatePostDto) {
    const { coverImage, publishedAt, slug, status, visibility, ...rest } = dto;
    const data = { ...rest } as Partial<Post> & {
      content?: PostContentBlock[] | string;
    };

    if (data.thumbnailUrl === undefined && coverImage !== undefined) {
      data.thumbnailUrl = coverImage;
    }

    if (typeof data.title === 'string') {
      data.title = data.title.trim();
      if (!data.title) {
        throw new BadRequestException('title cannot be empty');
      }
    }

    if (data.content !== undefined) {
      data.content = this.normalizeContentBlocks(data.content);
      if (data.content.length === 0) {
        throw new BadRequestException('content cannot be empty');
      }
    }

    if (typeof data.summary === 'string') {
      data.summary = data.summary.trim() || null;
    }

    if (typeof data.category === 'string') {
      data.category = data.category.trim() || null;
    }

    if (typeof data.thumbnailUrl === 'string') {
      data.thumbnailUrl = data.thumbnailUrl.trim() || null;
    }

    return data;
  }

  private normalizeContentBlocks(content?: PostContentBlock[] | string) {
    if (content === undefined) {
      return [];
    }

    if (typeof content === 'string') {
      const text = content.trim();
      return text
        ? [
            {
              id: randomUUID(),
              type: 'PARAGRAPH',
              text,
            } satisfies PostContentBlock,
          ]
        : [];
    }

    if (!Array.isArray(content)) {
      throw new BadRequestException('content must be an array');
    }

    return content.flatMap((block) => {
      if (!block || typeof block !== 'object') {
        throw new BadRequestException('content block must be an object');
      }

      const id = typeof block.id === 'string' && block.id.trim()
        ? block.id.trim()
        : randomUUID();

      if (block.type === 'HEADING' || block.type === 'PARAGRAPH') {
        const text = typeof block.text === 'string' ? block.text.trim() : '';
        return text ? [{ id, type: block.type, text } as PostContentBlock] : [];
      }

      if (block.type === 'IMAGE') {
        const imageUrl = typeof block.imageUrl === 'string'
          ? block.imageUrl.trim()
          : '';
        const caption = typeof block.caption === 'string'
          ? block.caption.trim()
          : '';

        return imageUrl
          ? [
              {
                id,
                type: 'IMAGE',
                imageUrl,
                ...(caption ? { caption } : {}),
              } as PostContentBlock,
            ]
          : [];
      }

      const invalidBlock = block as { type?: unknown };
      throw new BadRequestException(`Invalid content block type: ${String(invalidBlock.type)}`);
    });
  }

  private normalizeStatus(status: string): PostStatus {
    const normalizedStatus = status.trim().toUpperCase();
    if (!POST_STATUSES.includes(normalizedStatus as PostStatus)) {
      throw new BadRequestException(`Invalid post status: ${status}`);
    }

    return normalizedStatus as PostStatus;
  }

  private normalizeVisibility(visibility: string): PostVisibility {
    const normalizedVisibility = visibility.trim().toUpperCase();
    if (normalizedVisibility === 'INTERNAL') {
      return 'FAMILY';
    }

    if (!POST_VISIBILITIES.includes(normalizedVisibility as PostVisibility)) {
      throw new BadRequestException(`Invalid post visibility: ${visibility}`);
    }

    return normalizedVisibility as PostVisibility;
  }

  private normalizeDate(value: string | Date | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date value');
    }

    return date;
  }

  private normalizeSlug(slug?: string | null) {
    if (slug === undefined) {
      return undefined;
    }

    if (slug === null || !slug.trim()) {
      return null;
    }

    return this.slugify(slug);
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getImageExtension(file: PostUploadFile) {
    const extension = extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      return extension;
    }

    if (file.mimetype === 'image/png') return '.png';
    if (file.mimetype === 'image/webp') return '.webp';
    return '.jpg';
  }
}

