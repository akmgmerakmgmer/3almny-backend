import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleSignupDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string; // Google ID token from client
}
