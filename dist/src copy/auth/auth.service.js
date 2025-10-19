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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const google_auth_library_1 = require("google-auth-library");
const users_service_1 = require("../users/users.service");
const public_user_mapper_1 = require("../users/mappers/public-user.mapper");
const jwt_1 = require("@nestjs/jwt");
let AuthService = class AuthService {
    constructor(users, jwt) {
        this.users = users;
        this.jwt = jwt;
        const cid = process.env.GOOGLE_CLIENT_ID;
        if (cid) {
            this.googleClient = new google_auth_library_1.OAuth2Client(cid);
        }
    }
    async localSignup(username, email, password) {
        const user = await this.users.createLocal(username, email, password);
        return this.withTokens(user);
    }
    async localLogin(email, password) {
        const user = await this.users.validateLocal(email, password);
        return this.withTokens(user);
    }
    async googleSignup(idToken) {
        if (!this.googleClient)
            throw new common_1.UnauthorizedException('Google auth not configured');
        const ticket = await this.googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const username = payload.name || payload.email.split('@')[0];
        const user = await this.users.createGoogle(payload.sub, payload.email, username);
        return this.withTokens(user);
    }
    me(user) {
        return { user: { id: user.userId, email: user.email } };
    }
    withTokens(user) {
        const publicUser = (0, public_user_mapper_1.toPublicUser)(user);
        const accessToken = this.jwt.sign({ sub: publicUser.id, email: publicUser.email, provider: publicUser.provider });
        return { user: publicUser, tokens: { accessToken } };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService, jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map