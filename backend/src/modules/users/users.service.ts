import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { DeepPartial, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

type SafeUser = Omit<User, 'passwordHash'> & {
  username: string;
};

type CreateEntityInput = DeepPartial<User> & {
  password?: string;
  username: string;
  member?: any;
};

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Tạo người dùng mới và trả về dữ liệu an toàn (đã ẩn passwordHash)
  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    return this.toPublicUser(await this.createEntity(createUserDto));
  }

  // Khởi tạo entity người dùng, mã hóa mật khẩu và lưu vào database
  async createEntity(dto: CreateEntityInput): Promise<User> {
    if (dto.username) {
      const existingUser = await this.findByUsername(dto.username);

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }
    }

    const { password, ...userData } = dto;

    const user = this.usersRepository.create({
      ...userData,
      passwordHash: password
        ? await this.hashPassword(password)
        : dto.passwordHash,
    });

    return this.usersRepository.save(user);
  }

  // Lấy danh sách tất cả người dùng trong hệ thống
  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find({
      order: { id: 'ASC' },
      relations: ['member'],
    });

    return users.map((user) => this.toPublicUser(user));
  }

  // Lấy thông tin người dùng theo ID (alias của hàm findOne)
  async getUserInfo(id: number): Promise<SafeUser> {
    return this.findOne(id);
  }

  // Tìm người dùng theo ID và trả về dữ liệu công khai
  async findOne(id: number): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    return this.toPublicUser(user);
  }

  // Tìm kiếm người dùng trong DB bằng ID (trả về entity gốc hoặc null)
  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['member'],
    });
  }

  // Tìm kiếm người dùng trong DB bằng username
  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      relations: ['member'],
    });
  }

  // Lấy thông tin người dùng bằng username và ném lỗi nếu không tồn tại
  async getUserByUsername(username: string): Promise<SafeUser> {
    const user = await this.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  // Cập nhật thông tin người dùng theo ID
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

  // Lưu file ảnh đại diện được tải lên và trả về đường dẫn URL
  saveAvatarFile(file: Express.Multer.File): string {
    if (!file) {
      throw new BadRequestException('File không hợp lệ');
    }

    // Trả về đường dẫn tĩnh phục vụ client
    return `/uploads/avatarUser/${file.filename}`;
  }

  // Xóa người dùng khỏi hệ thống theo ID
  async remove(id: number): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    await this.usersRepository.remove(user);

    return this.toPublicUser(user);
  }

  // Cập nhật chuỗi passwordHash mới cho người dùng
  async updatePasswordHash(user: User, passwordHash: string): Promise<User> {
    user.passwordHash = passwordHash;

    return this.usersRepository.save(user);
  }

  // Hàm hỗ trợ tìm user theo ID, ném lỗi NotFoundException nếu không tìm thấy
  private async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Mã hóa mật khẩu thô bằng thuật toán scrypt kèm salt ngẫu nhiên
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;

    return `${salt}:${hash.toString('hex')}`;
  }

  // Bỏ trường nhạy cảm passwordHash trước khi trả dữ liệu về client
  toPublicUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;

    return {
      ...safeUser,
      isAdmin: user.isAdmin,
    };
  }
}
