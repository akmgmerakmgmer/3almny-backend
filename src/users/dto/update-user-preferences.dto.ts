import { IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { EducationSystem, Grade, Subject } from '../user.entity';

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsEnum(EducationSystem)
  educationSystem?: EducationSystem | null;

  @IsOptional()
  @IsEnum(Grade)
  grade?: Grade | null;

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsEnum(Subject)
  subject?: Subject | null;
}