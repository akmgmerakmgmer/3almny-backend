import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitPracticeQuestionDto {
  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return Number.isFinite(num) ? num : value;
  })
  @IsInt()
  @Min(0)
  selectedOptionIndex?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return false;
  })
  @IsBoolean()
  revealExplanation?: boolean;
}
