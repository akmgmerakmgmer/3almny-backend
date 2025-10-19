import { AuthService } from './auth.service';
import { LocalSignupDto } from './dto/local-signup.dto';
import { LocalLoginDto } from './dto/local-login.dto';
import { GoogleSignupDto } from './dto/google-signup.dto';
import { Response, Request } from 'express';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    signupLocal(dto: LocalSignupDto, res: Response): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
        };
    }>;
    loginLocal(dto: LocalLoginDto, res: Response): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
        };
    }>;
    signupGoogle(dto: GoogleSignupDto, res: Response): Promise<{
        success: boolean;
        data: {
            user: import("../users/mappers/public-user.mapper").PublicUserDto;
        };
    }>;
    me(req: Request): {
        success: boolean;
        data: {
            user: any;
        };
    };
    logout(res: Response): Promise<{
        success: boolean;
    }>;
    private setAuthCookie;
    private clearAuthCookies;
}
