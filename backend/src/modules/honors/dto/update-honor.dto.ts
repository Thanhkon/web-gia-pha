import { PartialType } from '@nestjs/mapped-types';
import { CreateHonorDto } from './create-honor.dto';

export class UpdateHonorDto extends PartialType(CreateHonorDto) {}
