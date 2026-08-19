import { FileInterceptor } from '@nestjs/platform-express';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Put,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import type { AuthenticatedRequest } from '../auth/guards/access-token.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
// Removed diskStorage and extname

import { multerOptions } from '../../utils/file-upload.util';

@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file', multerOptions()))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = this.usersService.saveAvatarFile(file);
    return { url };
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() createUserDto: CreateUserDto,
  ) {
    if (!req.user.isAdmin) throw new ForbiddenException('Admin only');
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    if (!req.user.isAdmin) throw new ForbiddenException('Admin only');
    return this.usersService.findAll();
  }

  // Lấy profile cá nhân
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.findOne(userId);
  }

  // Cập nhật profile cá nhân
  @Put('profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user.sub || req.user.id;
    // Không cho phép user thường tự đổi role
    if (!req.user.isAdmin && updateUserDto.role) {
      delete updateUserDto.role;
    }
    return this.usersService.update(userId, updateUserDto);
  }

  @Get('username/:username')
  findByUsername(
    @Req() req: AuthenticatedRequest,
    @Param('username') username: string,
  ) {
    if (!req.user.isAdmin && req.user.username !== username) {
      throw new ForbiddenException('Admin only or self');
    }
    return this.usersService.getUserByUsername(username);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException('Admin only');
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userId = req.user.sub || req.user.id;
    if (userId !== +id && !req.user.isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này',
      );
    }
    // Chỉ admin mới được đổi role
    if (!req.user.isAdmin && updateUserDto.role) {
      delete updateUserDto.role;
    }
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    if (!req.user.isAdmin) throw new ForbiddenException('Admin only');
    return this.usersService.remove(+id);
  }
}
