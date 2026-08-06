import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  email!: string;
  password!: string;
  name?: string;
  phone?: string;
  address?: string;
  // Định dạng ISO, ví dụ: '1998-05-20'
  dateOfBirth?: string;
  // Không bắt buộc, mặc định là UserRole.USER nếu không truyền
  role?: UserRole;
}
