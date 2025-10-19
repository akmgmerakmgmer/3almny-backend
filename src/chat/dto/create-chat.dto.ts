import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateChatDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  messages?: string[];
}
