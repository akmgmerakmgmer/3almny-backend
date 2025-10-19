import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // Assert the env var is defined (adjust handling as needed).
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    // Keep it minimal; payload should include sub (user id) and email.
    return { userId: payload.sub, email: payload.email, provider: payload.provider };
  }
}
