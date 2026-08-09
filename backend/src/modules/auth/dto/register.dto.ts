import { CreateMemberDto } from '../../members/dto/create-member.dto';

export class RegisterDto {
  username!: string;
  password!: string;
  member?: CreateMemberDto;
}
