import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

export class CreateMessageDto {
  @IsIn(['text', 'image', 'pdf', 'file', 'system'])
  type!: 'text' | 'image' | 'pdf' | 'file' | 'system';

  @IsString()
  content!: string; // for non-text types, expect a URL or reference id

  @IsIn(['user', 'assistant', 'system'])
  @IsOptional()
  role?: 'user' | 'assistant' | 'system';

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
