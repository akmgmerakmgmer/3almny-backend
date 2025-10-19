import { Body, Controller, Post, Res, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalSignupDto } from './dto/local-signup.dto';
import { LocalLoginDto } from './dto/local-login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signupLocal(@Body() dto: LocalSignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.localSignup(dto.username, dto.email, dto.password);
    this.setAuthCookie(res, tokens.accessToken);
    return { success: true, data: { user } };
  }

  @Post('login')
  async loginLocal(@Body() dto: LocalLoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.localLogin(dto.email, dto.password);
    this.setAuthCookie(res, tokens.accessToken);
    return { success: true, data: { user } };
  }

  @Post('google')
  async signupGoogle(@Body() dto: GoogleSignupDto, @Res({ passthrough: true }) res: Response) {
    const { user, tokens } = await this.auth.googleSignup(dto.idToken);
    this.setAuthCookie(res, tokens.accessToken);
    return { success: true, data: { user } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return { success: true, data: { user: (req as any).user } };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookies(res);
    return { success: true };
  }

  private setAuthCookie(res: Response, token: string) {
    const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: sevenDaysMs,
      path: '/',
    });
    // Non-sensitive presence cookie for frontend middleware gating.
    res.cookie('authp', '1', {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: sevenDaysMs,
      path: '/',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    res.clearCookie('authp', {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
