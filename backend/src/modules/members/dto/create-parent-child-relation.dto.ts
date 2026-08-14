import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateParentChildRelationDto {
  @IsInt()
  @IsNotEmpty()
  parentId!: number;

  @IsInt()
  @IsNotEmpty()
  childId!: number;

  @IsString()
  @IsOptional()
  relationType?: string;
}
