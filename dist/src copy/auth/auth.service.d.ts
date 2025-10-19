import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    private googleClient?;
    constructor(users: UsersService, jwt: JwtService);
    localSignup(username: string, email: string, password: string): Promise<{
        user: import("../users/mappers/public-user.mapper").PublicUserDto;
        tokens: {
            accessToken: string;
        };
    }>;
    localLogin(email: string, password: string): Promise<{
        user: import("../users/mappers/public-user.mapper").PublicUserDto;
        tokens: {
            accessToken: string;
        };
    }>;
    googleSignup(idToken: string): Promise<{
        user: import("../users/mappers/public-user.mapper").PublicUserDto;
        tokens: {
            accessToken: string;
        };
    }>;
    me(user: {
        userId: string;
        email: string;
    }): {
        user: {
            id: string;
            email: string;
        };
    };
    private withTokens;
}
