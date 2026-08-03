import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedStorageFile } from '../../common/storage/upload-result.interface';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@UseGuards(AccessTokenGuard)
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('families/:familyId/posts')
  create(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Req() request: AuthenticatedRequest,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(familyId, request.user!.id, createPostDto);
  }

  @Post('posts/uploads/images')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(@UploadedFile() file?: UploadedStorageFile) {
    return this.postsService.uploadImage(file);
  }

  @Get('families/:familyId/posts')
  findByFamily(
    @Param('familyId', ParseIntPipe) familyId: number,
    @Query('status') status?: string,
    @Query('visibility') visibility?: string,
    @Query('includeDeleted', new ParseBoolPipe({ optional: true }))
    includeDeleted?: boolean,
  ) {
    return this.postsService.findByFamily(familyId, {
      status,
      visibility,
      includeDeleted,
    });
  }

  @Get('posts/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Patch('posts/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, request.user!.id, updatePostDto);
  }

  @Delete('posts/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.remove(id);
  }

  @Patch('posts/:id/restore')
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.restore(id);
  }
}
