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
exports.ChatSchema = exports.Chat = exports.ChatMessage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ChatMessage = class ChatMessage {
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: () => new mongoose_2.Types.ObjectId().toString() }),
    __metadata("design:type", String)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['text', 'image', 'pdf', 'file', 'system'] }),
    __metadata("design:type", String)
], ChatMessage.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['user', 'assistant', 'system'], default: 'user' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "meta", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: () => new Date() }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, mongoose_1.Schema)({ _id: false, timestamps: false })
], ChatMessage);
const ChatMessageSchema = mongoose_1.SchemaFactory.createForClass(ChatMessage);
let Chat = class Chat {
};
exports.Chat = Chat;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Chat.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Chat.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ChatMessageSchema], default: [] }),
    __metadata("design:type", Array)
], Chat.prototype, "messages", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Chat.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Chat.prototype, "updatedAt", void 0);
exports.Chat = Chat = __decorate([
    (0, mongoose_1.Schema)({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
], Chat);
exports.ChatSchema = mongoose_1.SchemaFactory.createForClass(Chat);
exports.ChatSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
exports.ChatSchema.set('toObject', { virtuals: true });
//# sourceMappingURL=chat.schema.js.map