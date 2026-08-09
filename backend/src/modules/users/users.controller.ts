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
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('upload-avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatarUser',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(@UploadedFile() file: any) {
    const url = await this.usersService.saveAvatarFile(file);
    return { url };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // Lấy profile cá nhân
  @Get('profile')
  getProfile(@Req() req) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.findOne(userId);
  }

  // Cập nhật profile cá nhân
  @Put('profile')
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.sub || req.user.id;
    return this.usersService.update(userId, updateUserDto);
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.getUserByUsername(username);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Put(':id')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
