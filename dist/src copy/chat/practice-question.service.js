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
var PracticeQuestionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeQuestionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("./chat.schema");
const practice_question_schema_1 = require("./practice-question.schema");
let PracticeQuestionService = PracticeQuestionService_1 = class PracticeQuestionService {
    constructor(questions, chats) {
        var _a;
        this.questions = questions;
        this.chats = chats;
        this.logger = new common_1.Logger(PracticeQuestionService_1.name);
        this.endpoint = ((_a = process.env.OPENAI_BASE_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, '')) || 'https://api.openai.com/v1';
        this.apiKey = process.env.OPENAI_API_KEY;
    }
    async generateForMessage(userId, chatId, messageId, options = {}) {
        var _a, _b, _c;
        const chat = await this.loadChat(userId, chatId);
        const message = chat.messages.find((m) => m.id === messageId);
        if (!message)
            throw new common_1.NotFoundException('Message not found');
        if (message.role !== 'assistant') {
            throw new common_1.BadRequestException('Practice questions can only be generated from assistant responses.');
        }
        if (!((_a = message.meta) === null || _a === void 0 ? void 0 : _a.articleEligible)) {
            throw new common_1.BadRequestException('Practice questions require an exportable assistant response.');
        }
        const difficulty = this.normalizeDifficulty(options.difficulty);
        const count = this.normalizeCount(options.count);
        const language = this.resolveLanguage(options.language, message.content, message.meta);
        const generated = await this.generateQuestionsFromContent({
            content: message.content,
            difficulty,
            count,
            language,
            focus: options.focus,
            messageTitle: ((_b = message.meta) === null || _b === void 0 ? void 0 : _b.derivedTitle) || null,
        });
        let filtered = generated.filter((question) => difficulty === 'mixed' || question.difficulty === difficulty);
        if (!filtered.length && generated.length) {
            filtered = generated.slice(0, count);
        }
        if (!filtered.length) {
            filtered = this.buildFallbackQuestions(message.content, count, language, ((_c = message.meta) === null || _c === void 0 ? void 0 : _c.derivedTitle) || null, difficulty);
        }
        const limited = filtered.slice(0, count);
        if (!limited.length) {
            throw new common_1.BadRequestException('Unable to generate practice questions for this response.');
        }
        const docs = limited.map((q) => {
            var _a, _b;
            return ({
                chatId: chat._id,
                userId: chat.userId,
                messageId,
                question: q.question,
                type: q.type,
                difficulty: q.difficulty,
                options: q.options,
                correctOption: q.correctOption,
                acceptableAnswers: q.acceptableAnswers,
                explanation: q.explanation,
                autoGraded: q.autoGraded,
                language: q.language,
                sourceSummary: (_a = q.sourceSummary) !== null && _a !== void 0 ? _a : null,
                sourceTitle: (_b = q.sourceTitle) !== null && _b !== void 0 ? _b : null,
            });
        });
        const created = await this.questions.insertMany(docs);
        return created.map((doc) => this.toDto(doc));
    }
    async getQuestionsForMessage(userId, chatId, messageId, includeArchived = false) {
        const chat = await this.loadChat(userId, chatId);
        const query = {
            chatId: chat._id,
            userId: chat.userId,
            messageId,
        };
        if (!includeArchived)
            query.archived = false;
        const results = await this.questions.find(query).sort({ createdAt: -1 }).lean();
        return results.map((doc) => this.toDto(doc));
    }
    async submitAnswer(userId, questionId, answer) {
        var _a, _b, _c;
        const question = await this.questions.findById(questionId);
        if (!question)
            throw new common_1.NotFoundException('Practice question not found');
        if (question.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You cannot answer questions you do not own.');
        }
        if (question.archived) {
            throw new common_1.BadRequestException('This question has been archived.');
        }
        const evaluation = this.evaluateAnswer(question, answer);
        question.attempts += 1;
        if (evaluation.correct === true) {
            question.correctAttempts += 1;
        }
        await question.save();
        const accuracy = question.attempts > 0 ? Number((question.correctAttempts / question.attempts).toFixed(2)) : null;
        return {
            correct: evaluation.correct,
            evaluationAvailable: evaluation.available,
            explanation: (_a = question.explanation) !== null && _a !== void 0 ? _a : undefined,
            correctOption: (_b = question.correctOption) !== null && _b !== void 0 ? _b : undefined,
            acceptableAnswers: ((_c = question.acceptableAnswers) === null || _c === void 0 ? void 0 : _c.length) ? question.acceptableAnswers : undefined,
            stats: {
                attempts: question.attempts,
                correctAttempts: question.correctAttempts,
                accuracy,
            },
        };
    }
    async archiveQuestion(userId, questionId, archived = true) {
        const question = await this.questions.findById(questionId);
        if (!question)
            throw new common_1.NotFoundException('Practice question not found');
        if (question.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You cannot modify questions you do not own.');
        }
        question.archived = archived;
        await question.save();
        return this.toDto(question);
    }
    async getQuestion(userId, questionId) {
        const question = await this.questions.findById(questionId);
        if (!question)
            throw new common_1.NotFoundException('Practice question not found');
        if (question.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You cannot view questions you do not own.');
        }
        return this.toDto(question);
    }
    async getUserStatistics(userId) {
        if (!mongoose_2.Types.ObjectId.isValid(userId))
            return [];
        const pipeline = [
            { $match: { userId: new mongoose_2.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$difficulty',
                    total: { $sum: 1 },
                    archived: { $sum: { $cond: ['$archived', 1, 0] } },
                    attempts: { $sum: '$attempts' },
                    correctAttempts: { $sum: '$correctAttempts' },
                },
            },
        ];
        const data = await this.questions.aggregate(pipeline);
        return data.map((row) => ({
            difficulty: row._id,
            total: row.total,
            archived: row.archived,
            attempts: row.attempts,
            correctAttempts: row.correctAttempts,
            accuracy: row.attempts > 0 ? Number((row.correctAttempts / row.attempts).toFixed(2)) : null,
        }));
    }
    async loadChat(userId, chatId) {
        if (!mongoose_2.Types.ObjectId.isValid(chatId))
            throw new common_1.NotFoundException('Chat not found');
        const chat = await this.chats.findById(chatId);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        if (chat.userId.toString() !== userId) {
            throw new common_1.ForbiddenException('You do not own this chat.');
        }
        return chat;
    }
    normalizeDifficulty(diff) {
        switch ((diff || 'medium').toLowerCase()) {
            case 'easy':
            case 'medium':
            case 'hard':
                return diff;
            case 'mixed':
            default:
                return 'mixed';
        }
    }
    normalizeCount(count) {
        if (!count || Number.isNaN(count))
            return 5;
        return Math.min(Math.max(Math.floor(count), 1), 20);
    }
    resolveLanguage(preference, content, meta) {
        var _a;
        if (preference === 'en' || preference === 'ar')
            return preference;
        if ((_a = meta === null || meta === void 0 ? void 0 : meta.educationSystemContext) === null || _a === void 0 ? void 0 : _a.requiresArabic)
            return 'ar';
        if (typeof (meta === null || meta === void 0 ? void 0 : meta.language) === 'string') {
            const normalized = meta.language.toLowerCase();
            if (normalized === 'ar')
                return 'ar';
            if (normalized === 'en')
                return 'en';
        }
        const arabicRatio = this.estimateArabic(content);
        if (arabicRatio > 0.25)
            return 'ar';
        return 'en';
    }
    estimateArabic(content) {
        var _a;
        if (!content)
            return 0;
        const arabicChars = ((_a = content.match(/[\u0600-\u06FF]/g)) === null || _a === void 0 ? void 0 : _a.length) || 0;
        return arabicChars / Math.max(content.length, 1);
    }
    async generateQuestionsFromContent(params) {
        var _a, _b, _c, _d;
        const { content, difficulty, count, language, focus, messageTitle } = params;
        if (!content || content.trim().length < 50) {
            return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
        }
        if (!this.apiKey) {
            return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
        }
        const systemPrompt = this.buildSystemPrompt(language);
        const userPrompt = this.buildUserPrompt({ content, difficulty, count, focus, language, messageTitle });
        try {
            const response = await fetch(this.endpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    temperature: 0.5,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                }),
            });
            if (!response.ok) {
                this.logger.warn(`Practice question generation failed (${response.status}). Falling back.`);
                return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
            }
            const json = await response.json();
            const raw = (_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) !== null && _d !== void 0 ? _d : '';
            const parsed = this.extractQuestions(raw, difficulty);
            if (!parsed.length) {
                this.logger.warn('Practice question generation returned empty payload. Using fallback.');
                return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
            }
            return parsed.map((q) => ({ ...q, language }));
        }
        catch (error) {
            this.logger.error('Practice question generation error', error);
            return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
        }
    }
    buildSystemPrompt(language) {
        const base = 'You are an experienced teacher creating rigorous yet encouraging practice questions. Respond ONLY with minified JSON that matches this TypeScript type: {"questions":[{"question":string,"type":"multiple-choice"|"true-false","difficulty":"easy"|"medium"|"hard","options?":string[],"correctOption?":number,"answers?":string[],"explanation":string,"autoGraded":boolean}]}. Do not create question types other than multiple-choice or true-false. You MUST obey the user instructions about the exact number of questions and the required difficulty labels. For multiple choice, provide exactly 4 distinct options and the correctOption index (0-based). For true-false, omit options but include answers with "true" or "false". If you cannot auto-grade, set autoGraded false and provide guidance in the explanation.';
        if (language === 'ar') {
            return (base +
                ' Write all question text, options, answers, and explanations in Arabic. Keep JSON keys in English.');
        }
        return base + ' Write every field in clear English.';
    }
    buildUserPrompt(params) {
        const { content, difficulty, count, focus, language, messageTitle } = params;
        const baseTitle = messageTitle || (language === 'ar' ? 'رد تعليمي' : 'Educational response');
        const diffInstruction = difficulty === 'mixed'
            ? language === 'ar'
                ? 'وزع الصعوبة عبر الأسئلة (سهل، متوسط، صعب) وبنفس عدد الأسئلة المطلوب لكل مستوى قدر الإمكان.'
                : 'Provide a balanced mix of easy, medium, and hard questions matching the requested count as evenly as possible.'
            : language === 'ar'
                ? `اجعل كل سؤال بمستوى صعوبة ${difficulty} فقط. لا تستخدم أي مستوى آخر.`
                : `Make every question strictly ${difficulty} difficulty. Do not use any other difficulty level.`;
        const focusLine = focus
            ? language === 'ar'
                ? `ركز على: ${focus}.`
                : `Focus especially on: ${focus}.`
            : '';
        const trimmed = content.trim().slice(0, 7000);
        return [
            `${language === 'ar' ? 'الموضوع:' : 'Topic:'} ${baseTitle}.`,
            diffInstruction,
            `${language === 'ar' ? 'عدد الأسئلة المطلوب:' : 'Number of questions requested:'} ${count}.`,
            language === 'ar'
                ? `أعد JSON يحتوي على مصفوفة "questions" تضم ${count} عناصر بالضبط.`
                : `Return JSON whose "questions" array contains exactly ${count} items.`,
            focusLine,
            language === 'ar'
                ? 'اعتمد على المضمون التالي لإنشاء الأسئلة:'
                : 'Use the following assistant response as the knowledge source:',
            '"""',
            trimmed,
            '"""',
        ]
            .filter(Boolean)
            .join('\n');
    }
    extractQuestions(raw, requestedDifficulty) {
        if (!raw)
            return [];
        let jsonText = raw.trim();
        const braceMatch = raw.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            jsonText = braceMatch[0];
        }
        try {
            const data = JSON.parse(jsonText);
            const questions = Array.isArray(data === null || data === void 0 ? void 0 : data.questions) ? data.questions : [];
            return questions
                .map((item) => this.toSanitizedQuestion(item, requestedDifficulty))
                .filter((q) => !!q);
        }
        catch {
            return [];
        }
    }
    toSanitizedQuestion(entry, requestedDifficulty = 'mixed') {
        var _a, _b;
        if (!entry || typeof entry !== 'object')
            return null;
        const question = String((_a = entry.question) !== null && _a !== void 0 ? _a : '').trim();
        if (!question)
            return null;
        const type = this.normalizeType(entry.type);
        const difficulty = requestedDifficulty !== 'mixed'
            ? requestedDifficulty
            : this.normalizeDifficultyLabel((_b = entry.difficulty) !== null && _b !== void 0 ? _b : 'medium');
        const explanation = typeof entry.explanation === 'string' ? entry.explanation.trim() : undefined;
        let options;
        let correctOption;
        let acceptableAnswers = [];
        let autoGraded = entry.autoGraded === false ? false : true;
        if (type === 'multiple-choice') {
            const rawOptions = Array.isArray(entry.options) ? entry.options : [];
            const normalized = rawOptions
                .map((opt) => String(opt !== null && opt !== void 0 ? opt : '').trim())
                .filter((text) => !!text);
            if (!normalized.length)
                return null;
            const limited = normalized.slice(0, 4);
            if (limited.length < 2)
                return null;
            options = limited.map((text, index) => ({
                label: String.fromCharCode(65 + index) + '.',
                value: text,
            }));
            const candidate = typeof entry.correctOption === 'number' ? Math.floor(entry.correctOption) : 0;
            correctOption = candidate >= 0 && candidate < options.length ? candidate : 0;
            acceptableAnswers = Array.isArray(entry.answers)
                ? entry.answers.map((a) => String(a !== null && a !== void 0 ? a : '').trim()).filter((a) => !!a)
                : [];
        }
        else {
            options = undefined;
            correctOption = undefined;
            acceptableAnswers = this.normalizeTrueFalseAnswers(entry);
            if (!acceptableAnswers.length) {
                autoGraded = false;
            }
        }
        return {
            question,
            type,
            difficulty,
            options,
            correctOption,
            acceptableAnswers,
            explanation,
            autoGraded,
            language: 'en',
            sourceSummary: entry.sourceSummary && typeof entry.sourceSummary === 'string' ? entry.sourceSummary : undefined,
            sourceTitle: entry.sourceTitle && typeof entry.sourceTitle === 'string' ? entry.sourceTitle : undefined,
        };
    }
    normalizeType(value) {
        const normalized = (value || '').toString().toLowerCase();
        if (normalized === 'true-false' || normalized === 'true_false' || normalized === 'truefalse') {
            return 'true-false';
        }
        return 'multiple-choice';
    }
    normalizeDifficultyLabel(value) {
        const normalized = (value || '').toString().toLowerCase();
        if (normalized === 'easy' || normalized === 'hard')
            return normalized;
        if (normalized === 'medium' || normalized === 'moderate')
            return 'medium';
        return 'medium';
    }
    evaluateAnswer(question, body) {
        var _a;
        if (!question.autoGraded) {
            return { correct: null, available: false };
        }
        if (question.type === 'multiple-choice') {
            if (typeof body.selectedOptionIndex !== 'number') {
                throw new common_1.BadRequestException('selectedOptionIndex is required for multiple choice questions.');
            }
            const isCorrect = question.correctOption === body.selectedOptionIndex;
            return { correct: isCorrect, available: true };
        }
        if (question.type === 'true-false') {
            const provided = ((_a = body.answer) !== null && _a !== void 0 ? _a : '').toString().trim().toLowerCase();
            if (!provided) {
                throw new common_1.BadRequestException('Answer is required for true/false questions.');
            }
            const acceptable = (question.acceptableAnswers || []).map((a) => a.toLowerCase());
            if (!acceptable.length) {
                return { correct: null, available: false };
            }
            const isCorrect = acceptable.includes(provided);
            return { correct: isCorrect, available: true };
        }
        return { correct: null, available: false };
    }
    buildFallbackQuestions(content, count, language, messageTitle, requestedDifficulty) {
        const baselineQuestion = language === 'ar'
            ? 'صحيح أم خطأ: الفقرة تناقش فكرة أو مفهوماً واحداً بوضوح.'
            : 'True or False: The passage focuses on explaining a single core concept.';
        const summaryPrompt = (content === null || content === void 0 ? void 0 : content.trim().slice(0, 250)) || '';
        const fallbackDifficulty = requestedDifficulty !== 'mixed' ? requestedDifficulty : 'medium';
        const question = {
            question: baselineQuestion,
            type: 'true-false',
            difficulty: fallbackDifficulty,
            options: undefined,
            correctOption: undefined,
            acceptableAnswers: [],
            explanation: language === 'ar'
                ? 'يمكنك استخدام هذا السؤال للمراجعة الذاتية، ولن يتم تقييم الإجابة تلقائياً في الوضع الاحتياطي.'
                : 'Use this prompt for self-review; automatic grading is unavailable in the fallback mode.',
            autoGraded: false,
            language,
            sourceSummary: summaryPrompt || null,
            sourceTitle: messageTitle || null,
        };
        return Array.from({ length: count }, () => ({ ...question }));
    }
    normalizeTrueFalseAnswers(entry) {
        const values = [];
        const append = (value) => {
            const literal = this.toBooleanLiteral(value);
            if (literal)
                values.push(literal);
        };
        if (Array.isArray(entry.answers)) {
            entry.answers.forEach(append);
        }
        append(entry.answer);
        append(entry.correctAnswer);
        if (values.length === 0 && typeof entry.correctOption === 'number') {
            values.push(entry.correctOption === 0 ? 'true' : 'false');
        }
        return Array.from(new Set(values));
    }
    toBooleanLiteral(value) {
        const normalized = String(value !== null && value !== void 0 ? value : '').trim().toLowerCase();
        if (!normalized)
            return null;
        if (['true', 't', 'yes', '1', 'صحيح', 'صح'].includes(normalized))
            return 'true';
        if (['false', 'f', 'no', '0', 'خطأ', 'خطا', 'خاطئ'].includes(normalized))
            return 'false';
        return null;
    }
    toDto(doc) {
        const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
        const accuracy = plain.attempts > 0 ? Number((plain.correctAttempts / plain.attempts).toFixed(2)) : null;
        return {
            id: plain._id.toString(),
            chatId: plain.chatId.toString(),
            messageId: plain.messageId,
            question: plain.question,
            type: plain.type,
            difficulty: plain.difficulty,
            options: plain.options,
            explanation: plain.explanation,
            language: plain.language,
            autoGraded: plain.autoGraded,
            archived: plain.archived,
            stats: {
                attempts: plain.attempts,
                correctAttempts: plain.correctAttempts,
                accuracy,
            },
            createdAt: plain.createdAt,
            updatedAt: plain.updatedAt,
            sourceSummary: plain.sourceSummary,
            sourceTitle: plain.sourceTitle,
        };
    }
};
exports.PracticeQuestionService = PracticeQuestionService;
exports.PracticeQuestionService = PracticeQuestionService = PracticeQuestionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(practice_question_schema_1.PracticeQuestion.name)),
    __param(1, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PracticeQuestionService);
//# sourceMappingURL=practice-question.service.js.map