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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    toBookmarkPlain(entry) {
        var _a, _b, _c, _d, _e, _f;
        const plain = typeof (entry === null || entry === void 0 ? void 0 : entry.toObject) === 'function' ? entry.toObject() : entry;
        const serialized = {
            id: (_d = (_a = plain.id) !== null && _a !== void 0 ? _a : (_c = (_b = plain._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : new mongoose_2.Types.ObjectId().toString(),
            chatId: (_e = plain.chatId) !== null && _e !== void 0 ? _e : null,
            messageId: plain.messageId,
            role: plain.role,
            content: plain.content,
            meta: (_f = plain.meta) !== null && _f !== void 0 ? _f : {},
            savedAt: plain.savedAt instanceof Date
                ? plain.savedAt.toISOString()
                : new Date(plain.savedAt).toISOString(),
        };
        return serialized;
    }
    sanitizeBookmarkContent(content) {
        if (!content)
            return '';
        const trimmed = content.trim();
        const limit = 6000;
        if (trimmed.length <= limit)
            return trimmed;
        return `${trimmed.slice(0, limit - 3)}...`;
    }
    toStudyRecordPlain(entry) {
        var _a, _b, _c, _d;
        const plain = typeof (entry === null || entry === void 0 ? void 0 : entry.toObject) === 'function' ? entry.toObject() : entry;
        return {
            id: (_d = (_a = plain.id) !== null && _a !== void 0 ? _a : (_c = (_b = plain._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : new mongoose_2.Types.ObjectId().toString(),
            startedAt: (plain.startedAt instanceof Date ? plain.startedAt : new Date(plain.startedAt)).toISOString(),
            endedAt: (plain.endedAt instanceof Date ? plain.endedAt : new Date(plain.endedAt)).toISOString(),
            subject: plain.subject,
            timeSpentMinutes: typeof plain.timeSpentMinutes === 'number' ? plain.timeSpentMinutes : Number(plain.timeSpentMinutes) || 0,
        };
    }
    async createLocal(username, email, password) {
        const exists = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
        if (exists)
            throw new common_1.ConflictException('Email already in use');
        const hash = await bcrypt.hash(password, 10);
        const created = new this.userModel({
            username,
            email: email.toLowerCase(),
            passwordHash: hash,
            provider: 'local',
        });
        return created.save();
    }
    async createGoogle(googleId, email, username) {
        let user = await this.userModel.findOne({ googleId });
        if (user)
            return user;
        const emailTaken = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
        if (emailTaken)
            throw new common_1.ConflictException('Email already in use');
        user = new this.userModel({
            username,
            email: email.toLowerCase(),
            passwordHash: '',
            provider: 'google',
            googleId,
        });
        return user.save();
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email: email.toLowerCase() });
    }
    async findById(id) {
        return this.userModel.findById(id);
    }
    async validateLocal(email, password) {
        const user = await this.userModel
            .findOne({ email: email.toLowerCase(), provider: 'local' })
            .select('+passwordHash');
        if (!user)
            throw new common_1.NotFoundException('EMAIL_NOT_FOUND');
        const valid = await bcrypt.compare(password, user.passwordHash || '');
        if (!valid)
            throw new common_1.UnauthorizedException('INCORRECT_PASSWORD');
        return user;
    }
    async updatePreferences(userId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.educationSystem !== undefined) {
            user.educationSystem = dto.educationSystem;
        }
        if (dto.grade !== undefined) {
            user.grade = dto.grade;
        }
        if (dto.subject !== undefined) {
            user.subject = dto.subject;
        }
        return user.save();
    }
    async getBookmarks(userId, options) {
        var _a, _b, _c, _d;
        const user = await this.userModel.findById(userId).select('bookmarks');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        let list = ((_a = user.bookmarks) !== null && _a !== void 0 ? _a : [])
            .slice()
            .sort((a, b) => {
            const aTime = (a.savedAt instanceof Date ? a.savedAt : new Date(a.savedAt)).getTime();
            const bTime = (b.savedAt instanceof Date ? b.savedAt : new Date(b.savedAt)).getTime();
            return bTime - aTime;
        })
            .map(entry => this.toBookmarkPlain(entry));
        const query = (_b = options === null || options === void 0 ? void 0 : options.query) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
        if (query) {
            list = list.filter(entry => {
                var _a;
                const text = `${entry.content || ''} ${((_a = entry.meta) === null || _a === void 0 ? void 0 : _a.title) || ''}`.toLowerCase();
                return text.includes(query);
            });
        }
        const total = list.length;
        const limitCandidate = (_c = options === null || options === void 0 ? void 0 : options.limit) !== null && _c !== void 0 ? _c : 50;
        const safeLimit = Math.min(Math.max(limitCandidate, 1), 100);
        const offsetCandidate = (_d = options === null || options === void 0 ? void 0 : options.offset) !== null && _d !== void 0 ? _d : 0;
        const safeOffset = Math.max(offsetCandidate, 0);
        const paginated = list.slice(safeOffset, safeOffset + safeLimit);
        return {
            bookmarks: paginated,
            total,
            offset: safeOffset,
            limit: safeLimit,
            hasMore: safeOffset + safeLimit < total,
        };
    }
    async addBookmark(userId, dto) {
        var _a, _b;
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.bookmarks) {
            user.bookmarks = [];
        }
        const meta = dto.meta && typeof dto.meta === 'object' && !Array.isArray(dto.meta) ? dto.meta : {};
        const sanitizedContent = this.sanitizeBookmarkContent(dto.content || '');
        const now = new Date();
        const existing = user.bookmarks.find(b => b.messageId === dto.messageId);
        let target;
        if (existing) {
            existing.chatId = (_a = dto.chatId) !== null && _a !== void 0 ? _a : null;
            existing.role = dto.role;
            existing.content = sanitizedContent;
            existing.meta = meta;
            existing.savedAt = now;
            target = existing;
        }
        else {
            const entry = {
                id: new mongoose_2.Types.ObjectId().toString(),
                chatId: (_b = dto.chatId) !== null && _b !== void 0 ? _b : null,
                messageId: dto.messageId,
                role: dto.role,
                content: sanitizedContent,
                meta,
                savedAt: now,
            };
            user.bookmarks.push(entry);
            target = entry;
        }
        user.markModified('bookmarks');
        await user.save();
        return this.toBookmarkPlain(target);
    }
    async removeBookmark(userId, bookmarkId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.bookmarks || user.bookmarks.length === 0)
            return;
        const idx = user.bookmarks.findIndex(b => {
            var _a, _b, _c;
            const plainId = (_a = b.id) !== null && _a !== void 0 ? _a : (_c = (_b = b._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b);
            return plainId === bookmarkId;
        });
        if (idx === -1)
            return;
        user.bookmarks.splice(idx, 1);
        user.markModified('bookmarks');
        await user.save();
    }
    async getStudyRecords(userId, options) {
        var _a, _b, _c;
        const user = await this.userModel.findById(userId).select('records');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        let records = ((_a = user.records) !== null && _a !== void 0 ? _a : [])
            .slice()
            .sort((a, b) => {
            const aTime = (a.startedAt instanceof Date ? a.startedAt : new Date(a.startedAt)).getTime();
            const bTime = (b.startedAt instanceof Date ? b.startedAt : new Date(b.startedAt)).getTime();
            return bTime - aTime;
        })
            .map(entry => this.toStudyRecordPlain(entry));
        if ((options === null || options === void 0 ? void 0 : options.subject) && options.subject !== 'all') {
            records = records.filter(record => record.subject === options.subject);
        }
        const total = records.length;
        const totalMinutes = records.reduce((sum, item) => sum + (item.timeSpentMinutes || 0), 0);
        const limitCandidate = (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 20;
        const safeLimit = Math.min(Math.max(limitCandidate, 1), 100);
        const offsetCandidate = (_c = options === null || options === void 0 ? void 0 : options.offset) !== null && _c !== void 0 ? _c : 0;
        const safeOffset = Math.max(offsetCandidate, 0);
        const paginated = records.slice(safeOffset, safeOffset + safeLimit);
        const paginatedTotalMinutes = paginated.reduce((sum, item) => sum + (item.timeSpentMinutes || 0), 0);
        return {
            records: paginated,
            total,
            totalMinutes,
            offset: safeOffset,
            limit: safeLimit,
            hasMore: safeOffset + safeLimit < total,
            filteredTotal: records.length,
            filteredTotalMinutes: totalMinutes,
        };
    }
    async addStudyRecord(userId, dto) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const start = new Date(dto.startedAt);
        const end = new Date(dto.endedAt);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('Invalid start or end time');
        }
        if (end.getTime() <= start.getTime()) {
            throw new common_1.BadRequestException('End time must be after start time');
        }
        const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
        if (durationMinutes <= 0) {
            throw new common_1.BadRequestException('Study session must be at least one minute long');
        }
        const subject = dto.subject.trim();
        if (!subject) {
            throw new common_1.BadRequestException('Subject is required');
        }
        const record = {
            id: new mongoose_2.Types.ObjectId().toString(),
            startedAt: start,
            endedAt: end,
            subject,
            timeSpentMinutes: durationMinutes,
        };
        if (!Array.isArray(user.records)) {
            user.records = [];
        }
        user.records.push(record);
        user.markModified('records');
        await user.save();
        return this.toStudyRecordPlain(record);
    }
    async removeStudyRecord(userId, recordId) {
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!user.records || user.records.length === 0)
            return;
        const idx = user.records.findIndex(entry => {
            var _a, _b, _c;
            const plainId = (_a = entry.id) !== null && _a !== void 0 ? _a : (_c = (_b = entry._id) === null || _b === void 0 ? void 0 : _b.toString) === null || _c === void 0 ? void 0 : _c.call(_b);
            return plainId === recordId;
        });
        if (idx === -1)
            return;
        user.records.splice(idx, 1);
        user.markModified('records');
        await user.save();
    }
    async getRecordsFilters(userId) {
        var _a;
        const user = await this.userModel.findById(userId).select('records');
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const records = ((_a = user.records) !== null && _a !== void 0 ? _a : []).map(entry => this.toStudyRecordPlain(entry));
        const subjectsSet = new Set();
        records.forEach(record => {
            if (record.subject) {
                subjectsSet.add(record.subject);
            }
        });
        const subjects = Array.from(subjectsSet).sort();
        return {
            subjects,
            totalRecords: records.length,
        };
    }
    async getEducationSystemContext(userId) {
        const user = await this.userModel.findById(userId);
        if (!user || !user.educationSystem)
            return { context: null, requiresArabic: false };
        const arabicRequiredSystems = [
            user_entity_1.EducationSystem.PRIVATE_ARABIC,
            user_entity_1.EducationSystem.AZHAR,
            user_entity_1.EducationSystem.NATIONAL
        ];
        const requiresArabic = arabicRequiredSystems.includes(user.educationSystem);
        const systemDescriptions = {
            [user_entity_1.EducationSystem.PRIVATE_ARABIC]: 'The user follows the Private Arabic school system: national subjects taught in Arabic medium.',
            [user_entity_1.EducationSystem.EXPERIMENTAL]: 'The user follows the Experimental Language system: national subjects with Math/Science taught in English/French.',
            [user_entity_1.EducationSystem.AZHAR]: 'The user follows the Azhar system: national subjects plus religious studies.',
            [user_entity_1.EducationSystem.INTERNATIONAL]: 'The user follows the International system: completely different curricula with flexible subjects, usually taught in English/French/German medium.',
            [user_entity_1.EducationSystem.NATIONAL]: 'The user follows the National system: standard Egyptian curriculum in Arabic.'
        };
        let context = systemDescriptions[user.educationSystem] || '';
        if (user.grade) {
            const gradeDescriptions = {
                [user_entity_1.Grade.GRADE_1]: 'Grade 1 (Primary)',
                [user_entity_1.Grade.GRADE_2]: 'Grade 2 (Primary)',
                [user_entity_1.Grade.GRADE_3]: 'Grade 3 (Primary)',
                [user_entity_1.Grade.GRADE_4]: 'Grade 4 (Primary)',
                [user_entity_1.Grade.GRADE_5]: 'Grade 5 (Primary)',
                [user_entity_1.Grade.GRADE_6]: 'Grade 6 (Primary)',
                [user_entity_1.Grade.GRADE_7]: 'Grade 7 (Preparatory)',
                [user_entity_1.Grade.GRADE_8]: 'Grade 8 (Preparatory)',
                [user_entity_1.Grade.GRADE_9]: 'Grade 9 (Preparatory)',
                [user_entity_1.Grade.GRADE_10]: 'Grade 10 (Secondary)',
                [user_entity_1.Grade.GRADE_11]: 'Grade 11 (Secondary)',
                [user_entity_1.Grade.GRADE_12]: 'Grade 12 (Secondary)',
                [user_entity_1.Grade.YEAR_7]: 'Year 7 (International)',
                [user_entity_1.Grade.YEAR_8]: 'Year 8 (International)',
                [user_entity_1.Grade.YEAR_9]: 'Year 9 (International)',
                [user_entity_1.Grade.YEAR_10]: 'Year 10 (International)',
                [user_entity_1.Grade.YEAR_11]: 'Year 11 (International)',
                [user_entity_1.Grade.YEAR_12]: 'Year 12 (International)',
                [user_entity_1.Grade.YEAR_13]: 'Year 13 (International)'
            };
            const gradeInfo = gradeDescriptions[user.grade];
            if (gradeInfo) {
                context += ` The user is currently in ${gradeInfo}.`;
            }
        }
        if (user.subject) {
            const subjectDescriptions = {
                [user_entity_1.Subject.ARABIC]: 'Arabic',
                [user_entity_1.Subject.ENGLISH]: 'English',
                [user_entity_1.Subject.MATH]: 'Math',
                [user_entity_1.Subject.SCIENCE]: 'Science',
                [user_entity_1.Subject.RELIGION]: 'Religion',
                [user_entity_1.Subject.SOCIAL]: 'Social Studies',
                [user_entity_1.Subject.SECOND_LANG]: 'Second Language (e.g., French)',
                [user_entity_1.Subject.PHYSICS]: 'Physics',
                [user_entity_1.Subject.CHEMISTRY]: 'Chemistry',
                [user_entity_1.Subject.BIOLOGY]: 'Biology',
                [user_entity_1.Subject.HISTORY]: 'History',
                [user_entity_1.Subject.GEOGRAPHY]: 'Geography',
                [user_entity_1.Subject.PHILOSOPHY]: 'Philosophy',
                [user_entity_1.Subject.MATHS]: 'Maths',
                [user_entity_1.Subject.ICT]: 'ICT',
                [user_entity_1.Subject.BUSINESS]: 'Business/Economics',
                [user_entity_1.Subject.MATH_A]: 'Mathematics (A-Level)',
                [user_entity_1.Subject.PHYSICS_A]: 'Physics (A-Level)',
                [user_entity_1.Subject.CHEMISTRY_A]: 'Chemistry (A-Level)',
                [user_entity_1.Subject.BIOLOGY_A]: 'Biology (A-Level)',
                [user_entity_1.Subject.BUSINESS_A]: 'Business/Economics (A-Level)',
                [user_entity_1.Subject.QURAN]: 'Quran',
                [user_entity_1.Subject.FIQH]: 'Fiqh',
                [user_entity_1.Subject.HADITH]: 'Hadith',
            };
            const s = subjectDescriptions[user.subject];
            if (s)
                context += ` The selected subject is: ${s}.`;
        }
        return { context, requiresArabic };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map