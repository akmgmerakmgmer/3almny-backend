import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePracticeQuestionDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value === 'true';
    return true;
  })
  @IsBoolean()
  archived?: boolean;
}
