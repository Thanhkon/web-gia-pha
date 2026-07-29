import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

type SafeUser = Omit<User, 'passwordHash'>;

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    return this.toPublicUser(await this.createEntity(createUserDto));
  }

  async createEntity(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByUsername(createUserDto.username);

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const user = this.usersRepository.create({
      username: createUserDto.username,
      passwordHash: await this.hashPassword(createUserDto.password),
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      order: { id: 'ASC' },
    });

    return users.map((user) => this.toPublicUser(user));
  }

  async getUserInfo(id: number): Promise<SafeUser> {
    return this.findOne(id);
  }

  async findOne(id: number): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    return this.toPublicUser(user);
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async getUserByUsername(username: string): Promise<SafeUser> {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.findByUsername(updateUserDto.username);

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(user, updateUserDto);

    return this.toPublicUser(await this.usersRepository.save(user));
  }

  async updateProfileData(id: number, updateData: any): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.findByUsername(updateData.username);
      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    // Nếu có cập nhật avatar mới và user đã có avatar cũ trên server
    if (updateData.avatar && user.avatar) {
      // Kiểm tra nếu avatar cũ là tên file lưu trên server (không phải link ngoài hay blob)
      const oldAvatarPath = path.join('./src/images', user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        try {
          fs.unlinkSync(oldAvatarPath); // Xóa file ảnh cũ
        } catch (err) {
          console.error('Không thể xóa ảnh cũ:', err);
        }
      }
    }

    await this.usersRepository.update(id, updateData);

    const updatedUser = await this.findByIdOrThrow(id);
    return this.toPublicUser(updatedUser);
  }

  async remove(id: number): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    await this.usersRepository.remove(user);

    return this.toPublicUser(user);
  }

  async updatePasswordHash(user: User, passwordHash: string): Promise<User> {
    user.passwordHash = passwordHash;

    return this.usersRepository.save(user);
  }

  private async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
  }

  toPublicUser(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }
}