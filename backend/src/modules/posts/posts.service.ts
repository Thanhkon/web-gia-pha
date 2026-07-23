import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { Family } from '../members/entities/family.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  Post,
  POST_STATUSES,
  POST_VISIBILITIES,
  PostStatus,
  PostVisibility,
} from './entities/post.entity';

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

  async update(id: number, updatePostDto: UpdatePostDto) {
    const post = await this.postsRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
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

    if (!dto.content?.trim()) {
      throw new BadRequestException('content is required');
    }
  }

  private normalizePostInput(dto: CreatePostDto | UpdatePostDto) {
    const { publishedAt, slug, status, visibility, ...rest } = dto;
    const data: Partial<Post> = { ...rest };

    if (typeof data.title === 'string') {
      data.title = data.title.trim();
      if (!data.title) {
        throw new BadRequestException('title cannot be empty');
      }
    }

    if (typeof data.content === 'string') {
      data.content = data.content.trim();
      if (!data.content) {
        throw new BadRequestException('content cannot be empty');
      }
    }

    return data;
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
}

