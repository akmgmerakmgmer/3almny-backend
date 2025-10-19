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
exports.UserSchema = exports.User = exports.Subject = exports.Grade = exports.EducationSystem = exports.StudyRecordEntrySchema = exports.StudyRecordEntry = exports.BookmarkEntrySchema = exports.BookmarkEntry = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let BookmarkEntry = class BookmarkEntry {
};
exports.BookmarkEntry = BookmarkEntry;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: () => new mongoose_2.Types.ObjectId().toString() }),
    __metadata("design:type", String)
], BookmarkEntry.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], BookmarkEntry.prototype, "chatId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookmarkEntry.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['user', 'assistant', 'system'] }),
    __metadata("design:type", String)
], BookmarkEntry.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], BookmarkEntry.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], BookmarkEntry.prototype, "meta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: () => new Date() }),
    __metadata("design:type", Date)
], BookmarkEntry.prototype, "savedAt", void 0);
exports.BookmarkEntry = BookmarkEntry = __decorate([
    (0, mongoose_1.Schema)({ _id: false, timestamps: false })
], BookmarkEntry);
exports.BookmarkEntrySchema = mongoose_1.SchemaFactory.createForClass(BookmarkEntry);
let StudyRecordEntry = class StudyRecordEntry {
};
exports.StudyRecordEntry = StudyRecordEntry;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: () => new mongoose_2.Types.ObjectId().toString() }),
    __metadata("design:type", String)
], StudyRecordEntry.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], StudyRecordEntry.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true }),
    __metadata("design:type", Date)
], StudyRecordEntry.prototype, "endedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, trim: true, maxlength: 200 }),
    __metadata("design:type", String)
], StudyRecordEntry.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: true, min: 0 }),
    __metadata("design:type", Number)
], StudyRecordEntry.prototype, "timeSpentMinutes", void 0);
exports.StudyRecordEntry = StudyRecordEntry = __decorate([
    (0, mongoose_1.Schema)({ _id: false, timestamps: false })
], StudyRecordEntry);
exports.StudyRecordEntrySchema = mongoose_1.SchemaFactory.createForClass(StudyRecordEntry);
var EducationSystem;
(function (EducationSystem) {
    EducationSystem["PRIVATE_ARABIC"] = "private_arabic";
    EducationSystem["EXPERIMENTAL"] = "experimental";
    EducationSystem["AZHAR"] = "azhar";
    EducationSystem["INTERNATIONAL"] = "international";
    EducationSystem["NATIONAL"] = "national";
})(EducationSystem || (exports.EducationSystem = EducationSystem = {}));
var Grade;
(function (Grade) {
    Grade["GRADE_1"] = "grade_1";
    Grade["GRADE_2"] = "grade_2";
    Grade["GRADE_3"] = "grade_3";
    Grade["GRADE_4"] = "grade_4";
    Grade["GRADE_5"] = "grade_5";
    Grade["GRADE_6"] = "grade_6";
    Grade["GRADE_7"] = "grade_7";
    Grade["GRADE_8"] = "grade_8";
    Grade["GRADE_9"] = "grade_9";
    Grade["GRADE_10"] = "grade_10";
    Grade["GRADE_11"] = "grade_11";
    Grade["GRADE_12"] = "grade_12";
    Grade["YEAR_7"] = "year_7";
    Grade["YEAR_8"] = "year_8";
    Grade["YEAR_9"] = "year_9";
    Grade["YEAR_10"] = "year_10";
    Grade["YEAR_11"] = "year_11";
    Grade["YEAR_12"] = "year_12";
    Grade["YEAR_13"] = "year_13";
})(Grade || (exports.Grade = Grade = {}));
var Subject;
(function (Subject) {
    Subject["ARABIC"] = "arabic";
    Subject["ENGLISH"] = "english";
    Subject["MATH"] = "math";
    Subject["SCIENCE"] = "science";
    Subject["RELIGION"] = "religion";
    Subject["SOCIAL"] = "social";
    Subject["SECOND_LANG"] = "second_lang";
    Subject["PHYSICS"] = "physics";
    Subject["CHEMISTRY"] = "chemistry";
    Subject["BIOLOGY"] = "biology";
    Subject["HISTORY"] = "history";
    Subject["GEOGRAPHY"] = "geography";
    Subject["PHILOSOPHY"] = "philosophy";
    Subject["MATHS"] = "maths";
    Subject["ICT"] = "ict";
    Subject["BUSINESS"] = "business";
    Subject["MATH_A"] = "math_a";
    Subject["PHYSICS_A"] = "physics_a";
    Subject["CHEMISTRY_A"] = "chemistry_a";
    Subject["BIOLOGY_A"] = "biology_a";
    Subject["BUSINESS_A"] = "business_a";
    Subject["QURAN"] = "quran";
    Subject["FIQH"] = "fiqh";
    Subject["HADITH"] = "hadith";
})(Subject || (exports.Subject = Subject = {}));
let User = class User {
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true, lowercase: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '', select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['local', 'google'] }),
    __metadata("design:type", String)
], User.prototype, "provider", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], User.prototype, "googleId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(EducationSystem),
        default: null
    }),
    __metadata("design:type", Object)
], User.prototype, "educationSystem", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(Grade),
        default: null
    }),
    __metadata("design:type", Object)
], User.prototype, "grade", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(Subject),
        default: null
    }),
    __metadata("design:type", Object)
], User.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.BookmarkEntrySchema], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "bookmarks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.StudyRecordEntrySchema], default: [] }),
    __metadata("design:type", Array)
], User.prototype, "records", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.passwordHash;
        return ret;
    },
});
exports.UserSchema.set('toObject', { virtuals: true });
//# sourceMappingURL=user.entity.js.map