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
exports.PracticeQuestionSchema = exports.PracticeQuestion = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("./chat.schema");
let PracticeQuestion = class PracticeQuestion {
};
exports.PracticeQuestion = PracticeQuestion;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.SchemaTypes.ObjectId, ref: chat_schema_1.Chat.name, index: true, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PracticeQuestion.prototype, "chatId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.SchemaTypes.ObjectId, ref: 'User', index: true, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], PracticeQuestion.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, index: true }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "difficulty", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['multiple-choice', 'true-false'],
        default: 'multiple-choice',
    }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "question", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ label: String, value: String }],
        default: undefined,
    }),
    __metadata("design:type", Array)
], PracticeQuestion.prototype, "options", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 0 }),
    __metadata("design:type", Number)
], PracticeQuestion.prototype, "correctOption", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], PracticeQuestion.prototype, "acceptableAnswers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "explanation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], PracticeQuestion.prototype, "autoGraded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false, index: true }),
    __metadata("design:type", Boolean)
], PracticeQuestion.prototype, "archived", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], PracticeQuestion.prototype, "attempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], PracticeQuestion.prototype, "correctAttempts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['en', 'ar'], default: 'en' }),
    __metadata("design:type", String)
], PracticeQuestion.prototype, "language", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PracticeQuestion.prototype, "sourceSummary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], PracticeQuestion.prototype, "sourceTitle", void 0);
exports.PracticeQuestion = PracticeQuestion = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PracticeQuestion);
exports.PracticeQuestionSchema = mongoose_1.SchemaFactory.createForClass(PracticeQuestion);
exports.PracticeQuestionSchema.index({ chatId: 1, messageId: 1, archived: 1 });
exports.PracticeQuestionSchema.index({ userId: 1, archived: 1 });
//# sourceMappingURL=practice-question.schema.js.map