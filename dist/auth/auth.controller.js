"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_signup_dto_1 = require("./dto/local-signup.dto");
const local_login_dto_1 = require("./dto/local-login.dto");
const google_signup_dto_1 = require("./dto/google-signup.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    async signupLocal(dto, res) {
        const { user, tokens } = await this.auth.localSignup(dto.username, dto.email, dto.password);
        this.setAuthCookie(res, tokens.accessToken);
        return { success: true, data: { user } };
    }
    async loginLocal(dto, res) {
        const { user, tokens } = await this.auth.localLogin(dto.email, dto.password);
        this.setAuthCookie(res, tokens.accessToken);
        return { success: true, data: { user } };
    }
    async signupGoogle(dto, res) {
        const { user, tokens } = await this.auth.googleSignup(dto.idToken);
        this.setAuthCookie(res, tokens.accessToken);
        return { success: true, data: { user } };
    }
    me(req) {
        return { success: true, data: { user: req.user } };
    }
    async logout(res) {
        this.clearAuthCookies(res);
        return { success: true };
    }
    setAuthCookie(res, token) {
        const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: sevenDaysMs,
            path: '/',
        });
        res.cookie('authp', '1', {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: sevenDaysMs,
            path: '/',
        });
    }
    clearAuthCookies(res) {
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
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [local_signup_dto_1.LocalSignupDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupLocal", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [local_login_dto_1.LocalLoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginLocal", null);
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_signup_dto_1.GoogleSignupDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupGoogle", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map