import { AuthService } from './auth.service';
import { LocalSignupDto } from './dto/local-signup.dto';
import { LocalLoginDto } from './dto/local-login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { Request } from 'express';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    signupLocal(dto: LocalSignupDto): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
            accessToken: string;
        };
    }>;
    loginLocal(dto: LocalLoginDto): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
            accessToken: string;
        };
    }>;
    signupGoogle(dto: GoogleSignupDto): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
            accessToken: string;
        };
    }>;
    me(req: Request): {
        success: boolean;
        data: {
            user: any;
        };
    };
    logout(): Promise<{
        success: boolean;
    }>;
}
