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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("./chat.schema");
const education_classifier_service_1 = require("./education-classifier.service");
const title_generator_service_1 = require("./title-generator.service");
const users_service_1 = require("../users/users.service");
let ChatService = class ChatService {
    constructor(chatModel, educationClassifier, titleGenerator, usersService) {
        this.chatModel = chatModel;
        this.educationClassifier = educationClassifier;
        this.titleGenerator = titleGenerator;
        this.usersService = usersService;
    }
    escapeRegex(input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    ensureOwner(chat, userId) {
        if (chat.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not own this chat');
        }
    }
    async create(userId, dto) {
        if (!userId || !mongoose_2.Types.ObjectId.isValid(userId)) {
            throw new common_1.ForbiddenException('Invalid user context for chat creation');
        }
        const chat = await this.chatModel.create({
            title: 'New Chat',
            userId: new mongoose_2.Types.ObjectId(userId),
            messages: (dto.messages || []).map((m) => ({ ...m, createdAt: new Date() })),
        });
        return chat.toJSON();
    }
    async findAll(userId) {
        const chats = await this.chatModel.find({ userId: new mongoose_2.Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean();
        return chats.map(c => ({ ...c, id: c._id, _id: undefined }));
    }
    async findAllWithPagination(userId, limit = 20, offset = 0) {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safeOffset = Math.max(offset, 0);
        const query = { userId: new mongoose_2.Types.ObjectId(userId) };
        const [items, total] = await Promise.all([
            this.chatModel.find(query).sort({ updatedAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
            this.chatModel.countDocuments(query)
        ]);
        const data = items.map(c => ({ ...c, id: c._id, _id: undefined }));
        return { data, total, limit: safeLimit, offset: safeOffset, nextOffset: safeOffset + data.length < total ? safeOffset + data.length : null };
    }
    async findOne(userId, id) {
        const chat = await this.chatModel.findById(id);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        return chat.toJSON();
    }
    async update(userId, id, dto) {
        const chat = await this.chatModel.findById(id);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        if (dto.title !== undefined)
            chat.title = dto.title;
        await chat.save();
        return chat.toJSON();
    }
    async remove(userId, id) {
        const chat = await this.chatModel.findById(id);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        await chat.deleteOne();
        return { deleted: true };
    }
    async addMessage(userId, chatId, dto) {
        var _a;
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        let meta = dto.meta || {};
        const role = (dto.role || 'user');
        if (role === 'user') {
            const educationContext = await this.usersService.getEducationSystemContext(userId);
            if (educationContext) {
                meta.educationSystemContext = educationContext;
            }
        }
        if (role === 'assistant' && dto.content) {
            const content = dto.content;
            const wordCount = content.trim().split(/\s+/).length;
            const paragraphCount = content.split(/\n{2,}/).filter(p => p.trim().length > 0).length;
            const hasHeadings = /(^|\n)#+\s|(^|\n)(?:\d+\.|[-*])\s/.test(content);
            const substantive = wordCount >= 120 || paragraphCount >= 3 || hasHeadings;
            if (substantive) {
                try {
                    const educational = await this.educationClassifier.isEducational(content);
                    meta.articleEligible = educational && substantive;
                }
                catch (e) {
                    meta.articleEligible = false;
                }
            }
            else {
                meta.articleEligible = false;
            }
        }
        const message = { ...dto, role, meta, id: new mongoose_2.Types.ObjectId().toString(), createdAt: new Date() };
        chat.messages.push(message);
        await chat.save();
        if (role === 'assistant' && chat.title === 'New Chat') {
            const assistantText = ((_a = dto.content) === null || _a === void 0 ? void 0 : _a.trim()) || '';
            const userContext = chat.messages.filter(m => m.role === 'user').slice(-3).map(m => ({ role: 'user', content: m.content }));
            const context = [...userContext, { role: 'assistant', content: assistantText }];
            if (assistantText.split(/\s+/).length >= 15) {
                this.titleGenerator.generate(context).then(title => {
                    if (title && title !== 'New Chat') {
                        this.chatModel.updateOne({ _id: chat._id, title: 'New Chat' }, { $set: { title } }).catch(() => { });
                    }
                }).catch(() => { });
            }
        }
        return message;
    }
    async getMessagesWithEducationContext(userId, chatId) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        const educationContext = await this.usersService.getEducationSystemContext(userId);
        const messages = chat.messages.map((m) => ({
            role: m.role,
            content: m.content,
            meta: m.meta
        }));
        if (educationContext) {
            return [
                {
                    role: 'system',
                    content: educationContext,
                    meta: { isEducationSystemContext: true }
                },
                ...messages
            ];
        }
        return messages;
    }
    async removeMessage(userId, chatId, messageId) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        this.ensureOwner(chat, userId);
        const idx = chat.messages.findIndex(m => m.id === messageId);
        if (idx === -1)
            throw new common_1.NotFoundException('Message not found');
        const [removed] = chat.messages.splice(idx, 1);
        await chat.save();
        return removed;
    }
    async searchMessages(userId, query, limit = 20, offset = 0) {
        var _a, _b;
        const trimmed = (query || '').trim();
        if (!trimmed) {
            return { results: [], total: 0, limit, offset: 0, hasMore: false };
        }
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safeOffset = Math.max(offset, 0);
        const escaped = this.escapeRegex(trimmed);
        const regex = new RegExp(escaped, 'i');
        const pipeline = [
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
            { $project: { title: 1, messages: 1 } },
            { $unwind: { path: '$messages', includeArrayIndex: 'messageIndex' } },
            { $match: { 'messages.content': { $regex: regex } } },
            { $sort: { 'messages.createdAt': -1 } },
            {
                $facet: {
                    data: [
                        { $skip: safeOffset },
                        { $limit: safeLimit },
                        {
                            $project: {
                                chatId: '$_id',
                                chatTitle: '$title',
                                messageId: '$messages.id',
                                messageContent: '$messages.content',
                                messageRole: '$messages.role',
                                messageCreatedAt: '$messages.createdAt',
                                messageIndex: '$messageIndex',
                            },
                        },
                    ],
                    total: [{ $count: 'count' }],
                },
            },
        ];
        const [agg] = await this.chatModel.aggregate(pipeline);
        const rawResults = (agg === null || agg === void 0 ? void 0 : agg.data) || [];
        const total = ((_b = (_a = agg === null || agg === void 0 ? void 0 : agg.total) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
        const results = rawResults.map((item) => ({
            chatId: item.chatId.toString(),
            chatTitle: item.chatTitle,
            messageId: item.messageId,
            messageContent: item.messageContent,
            messageRole: item.messageRole,
            messageCreatedAt: item.messageCreatedAt,
            messageIndex: item.messageIndex,
        }));
        const hasMore = safeOffset + results.length < total;
        return { results, total, limit: safeLimit, offset: safeOffset, hasMore };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        education_classifier_service_1.EducationClassifierService,
        title_generator_service_1.TitleGeneratorService,
        users_service_1.UsersService])
], ChatService);
//# sourceMappingURL=chat.service.js.map