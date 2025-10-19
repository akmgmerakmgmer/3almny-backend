import { IsEmail, MinLength } from 'class-validator';

export class LocalLoginDto {
  @IsEmail()
  email!: string;

  @MinLength(6)
  password!: string;
}
