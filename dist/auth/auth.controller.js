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
    async signupLocal(dto) {
        const { user, tokens } = await this.auth.localSignup(dto.username, dto.email, dto.password);
        return { success: true, data: { user, accessToken: tokens.accessToken } };
    }
    async loginLocal(dto) {
        const { user, tokens } = await this.auth.localLogin(dto.email, dto.password);
        return { success: true, data: { user, accessToken: tokens.accessToken } };
    }
    async signupGoogle(dto) {
        const { user, tokens } = await this.auth.googleSignup(dto.idToken);
        return { success: true, data: { user, accessToken: tokens.accessToken } };
    }
    me(req) {
        return { success: true, data: { user: req.user } };
    }
    async logout() {
        return { success: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [local_signup_dto_1.LocalSignupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupLocal", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [local_login_dto_1.LocalLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginLocal", null);
__decorate([
    (0, common_1.Post)('google'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [google_signup_dto_1.GoogleSignupDto]),
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map