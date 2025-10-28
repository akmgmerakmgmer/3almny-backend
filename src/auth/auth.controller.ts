import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalSignupDto } from './dto/local-signup.dto';
import { LocalLoginDto } from './dto/local-login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signupLocal(@Body() dto: LocalSignupDto) {
    const { user, tokens } = await this.auth.localSignup(dto.username, dto.email, dto.password);
    return { success: true, data: { user, accessToken: tokens.accessToken } };
  }

  @Post('login')
  async loginLocal(@Body() dto: LocalLoginDto) {
    const { user, tokens } = await this.auth.localLogin(dto.email, dto.password);
    return { success: true, data: { user, accessToken: tokens.accessToken } };
  }

  @Post('google')
  async signupGoogle(@Body() dto: GoogleSignupDto) {
    const { user, tokens } = await this.auth.googleSignup(dto.idToken);
    return { success: true, data: { user, accessToken: tokens.accessToken } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return { success: true, data: { user: (req as any).user } };
  }

  @Post('logout')
  async logout() {
    return { success: true };
  }
}
