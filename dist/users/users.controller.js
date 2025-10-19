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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const update_user_preferences_dto_1 = require("./dto/update-user-preferences.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_user_mapper_1 = require("./mappers/public-user.mapper");
const create_bookmark_dto_1 = require("./dto/create-bookmark.dto");
const create_study_record_dto_1 = require("./dto/create-study-record.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getMe(req) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) {
            return { user: null };
        }
        return { user: (0, public_user_mapper_1.toPublicUser)(user) };
    }
    async updatePreferences(req, dto) {
        const user = await this.usersService.updatePreferences(req.user.userId, dto);
        return { user: (0, public_user_mapper_1.toPublicUser)(user) };
    }
    async getEducationContext(req) {
        const result = await this.usersService.getEducationSystemContext(req.user.userId);
        return result;
    }
    async getBookmarks(req, q, offset, limit) {
        const numericOffset = offset ? parseInt(offset, 10) : undefined;
        const numericLimit = limit ? parseInt(limit, 10) : undefined;
        const result = await this.usersService.getBookmarks(req.user.userId, {
            query: q,
            offset: Number.isFinite(numericOffset) ? numericOffset : undefined,
            limit: Number.isFinite(numericLimit) ? numericLimit : undefined,
        });
        return result;
    }
    async addBookmark(req, dto) {
        const bookmark = await this.usersService.addBookmark(req.user.userId, dto);
        return bookmark;
    }
    async removeBookmark(req, bookmarkId) {
        await this.usersService.removeBookmark(req.user.userId, bookmarkId);
        return { success: true };
    }
    async getStudyRecords(req, subject, grade, offset, limit) {
        const numericOffset = offset ? parseInt(offset, 10) : undefined;
        const numericLimit = limit ? parseInt(limit, 10) : undefined;
        return this.usersService.getStudyRecords(req.user.userId, {
            subject,
            grade,
            offset: Number.isFinite(numericOffset) ? numericOffset : undefined,
            limit: Number.isFinite(numericLimit) ? numericLimit : undefined,
        });
    }
    async getRecordsFilters(req) {
        return this.usersService.getRecordsFilters(req.user.userId);
    }
    async addStudyRecord(req, dto) {
        const record = await this.usersService.addStudyRecord(req.user.userId, dto);
        return { record };
    }
    async removeStudyRecord(req, recordId) {
        await this.usersService.removeStudyRecord(req.user.userId, recordId);
        return { success: true };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)('preferences'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_preferences_dto_1.UpdateUserPreferencesDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('education-context'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getEducationContext", null);
__decorate([
    (0, common_1.Get)('bookmarks'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('offset')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getBookmarks", null);
__decorate([
    (0, common_1.Post)('bookmarks'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bookmark_dto_1.CreateBookmarkDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addBookmark", null);
__decorate([
    (0, common_1.Delete)('bookmarks/:bookmarkId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('bookmarkId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeBookmark", null);
__decorate([
    (0, common_1.Get)('records'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('subject')),
    __param(2, (0, common_1.Query)('grade')),
    __param(3, (0, common_1.Query)('offset')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStudyRecords", null);
__decorate([
    (0, common_1.Get)('records/filters'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRecordsFilters", null);
__decorate([
    (0, common_1.Post)('records'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_study_record_dto_1.CreateStudyRecordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "addStudyRecord", null);
__decorate([
    (0, common_1.Delete)('records/:recordId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('recordId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeStudyRecord", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map