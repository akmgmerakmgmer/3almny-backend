import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GeneratePracticeQuestionsDto {
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard', 'mixed'])
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  })
  @IsInt()
  @Min(1)
  @Max(10)
  count?: number;

  @IsOptional()
  @IsIn(['auto', 'en', 'ar'])
  language?: 'auto' | 'en' | 'ar';

  @IsOptional()
  @IsString()
  focus?: string;
}
