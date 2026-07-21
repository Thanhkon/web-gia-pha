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
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
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

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async getUserByEmail(email: string): Promise<SafeUser> {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.findByIdOrThrow(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);

    return this.toPublicUser(await this.usersRepository.save(user));
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
