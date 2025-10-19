import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { toPublicUser } from '../users/mappers/public-user.mapper';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private googleClient?: OAuth2Client;

  constructor(private readonly users: UsersService, private readonly jwt: JwtService) {
    const cid = process.env.GOOGLE_CLIENT_ID;
    if (cid) {
      this.googleClient = new OAuth2Client(cid);
    }
  }

  async localSignup(username: string, email: string, password: string) {
    const user = await this.users.createLocal(username, email, password);
    return this.withTokens(user);
  }

  async localLogin(email: string, password: string) {
    const user = await this.users.validateLocal(email, password);
    return this.withTokens(user);
  }

  async googleSignup(idToken: string) {
    if (!this.googleClient) throw new UnauthorizedException('Google auth not configured');
    const ticket = await this.googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }
    const username = payload.name || payload.email.split('@')[0];
    const user = await this.users.createGoogle(payload.sub, payload.email, username);
    return this.withTokens(user);
  }

  me(user: { userId: string; email: string }) {
    return { user: { id: user.userId, email: user.email } };
  }

  private withTokens(user: any) {
    const publicUser = toPublicUser(user);
    // Access token currently signed without explicit expiresIn here; default configured in JwtModule (if any).
    // Because we now persist the cookie for 7 days, strongly consider adding an expiresIn (e.g., 15m) and issuing a refresh token instead.
    const accessToken = this.jwt.sign({ sub: publicUser.id, email: publicUser.email, provider: publicUser.provider });
    return { user: publicUser, tokens: { accessToken } };
  }
}
