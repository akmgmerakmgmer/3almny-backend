import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export const BOOKMARK_ROLES = ['user', 'assistant', 'system'] as const;
export type BookmarkRole = typeof BOOKMARK_ROLES[number];

export class CreateBookmarkDto {
  @IsOptional()
  @IsString()
  chatId?: string | null;

  @IsString()
  messageId!: string;

  @IsIn(BOOKMARK_ROLES)
  role!: BookmarkRole;

  @IsString()
  content!: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
