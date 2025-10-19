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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const puppeteer_1 = require("puppeteer");
const chat_service_1 = require("./chat.service");
const title_generator_service_1 = require("./title-generator.service");
const users_service_1 = require("../users/users.service");
const create_chat_dto_1 = require("./dto/create-chat.dto");
const update_chat_dto_1 = require("./dto/update-chat.dto");
const create_message_dto_1 = require("./dto/create-message.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const practice_question_service_1 = require("./practice-question.service");
const generate_practice_questions_dto_1 = require("./dto/generate-practice-questions.dto");
const submit_practice_question_dto_1 = require("./dto/submit-practice-question.dto");
const update_practice_question_dto_1 = require("./dto/update-practice-question.dto");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const course_recommendation_service_1 = require("./course-recommendation.service");
let ChatController = class ChatController {
    constructor(chats, titleGen, usersService, practiceQuestions, courseRecommendations) {
        this.chats = chats;
        this.titleGen = titleGen;
        this.usersService = usersService;
        this.practiceQuestions = practiceQuestions;
        this.courseRecommendations = courseRecommendations;
    }
    userId(req) {
        return req.user.userId;
    }
    async create(req, dto) {
        const data = await this.chats.create(this.userId(req), dto);
        return { success: true, data };
    }
    async list(req, limit, offset) {
        const lim = parseInt(limit || '20', 10);
        const off = parseInt(offset || '0', 10);
        const page = await this.chats.findAllWithPagination(this.userId(req), lim, off);
        return { success: true, ...page };
    }
    async getCourseRecommendations(req, topic, language, count) {
        var _a, _b;
        const trimmedTopic = (topic || '').trim().slice(0, 160);
        const normalizedLanguage = language === 'ar' ? 'ar' : language === 'en' ? 'en' : undefined;
        const numericCount = count ? Number(count) : undefined;
        const safeCount = Number.isFinite(numericCount) && numericCount ? Math.round(Number(numericCount)) : undefined;
        const courses = await this.courseRecommendations.recommendCourses(this.userId(req), {
            topic: trimmedTopic,
            language: normalizedLanguage,
            count: safeCount,
        });
        return {
            success: true,
            data: {
                courses,
                language: normalizedLanguage !== null && normalizedLanguage !== void 0 ? normalizedLanguage : ((_b = (_a = courses[0]) === null || _a === void 0 ? void 0 : _a.language) !== null && _b !== void 0 ? _b : 'en'),
                topic: trimmedTopic,
            },
        };
    }
    async searchMessages(req, q, limit, offset) {
        const lim = parseInt(limit || '20', 10);
        const off = parseInt(offset || '0', 10);
        const page = await this.chats.searchMessages(this.userId(req), q, lim, off);
        return { success: true, ...page };
    }
    async listByUser(req, userId) {
        const current = this.userId(req);
        if (current !== userId)
            throw new common_1.ForbiddenException('Cannot view other user chats');
        const data = await this.chats.findAll(userId);
        return { success: true, data };
    }
    async exportPdf(req, id, messageId, res) {
        const chat = await this.chats.findOne(this.userId(req), id).catch(() => null);
        if (!chat)
            throw new common_1.NotFoundException('Chat not found');
        const messages = chat.messages || [];
        let targetAssistant;
        if (messageId) {
            targetAssistant = messages.find(m => m.id === messageId && m.role === 'assistant');
            if (!targetAssistant) {
                throw new common_1.NotFoundException('Assistant message not found');
            }
        }
        else {
            targetAssistant = [...messages].reverse().find(m => m.role === 'assistant');
        }
        const assistantRaw = ((targetAssistant === null || targetAssistant === void 0 ? void 0 : targetAssistant.content) || '').trim();
        let computedFileTitle = deriveContextTitle(assistantRaw) || 'Export';
        try {
            const singleTitle = await this.titleGen.generateForContent(assistantRaw);
            if (singleTitle)
                computedFileTitle = singleTitle;
        }
        catch { }
        const fileBase = (computedFileTitle + (messageId ? '-msg-' + messageId.slice(0, 6) : '')).replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'export';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);
        const raw = ((targetAssistant === null || targetAssistant === void 0 ? void 0 : targetAssistant.content) || '').trim();
        const outline = buildOutline(raw);
        let computedTitle = computedFileTitle;
        let sections = { summary: '', examples: [], details: '' };
        let requiresArabic = false;
        try {
            const userId = this.userId(req);
            const educationContext = await this.usersService.getEducationSystemContext(userId);
            requiresArabic = educationContext.requiresArabic;
            if (raw) {
                sections = await this.titleGen.generateSections(raw, requiresArabic);
            }
        }
        catch { }
        const dir = requiresArabic ? 'rtl' : 'ltr';
        const align = requiresArabic ? 'right' : 'left';
        const html = buildHtml({
            title: computedTitle,
            generatedAt: new Date().toLocaleString(),
            dir,
            align,
            outline,
            sections,
            empty: !raw,
        });
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        let browser = null;
        try {
            console.log('Starting PDF generation for chat:', id);
            browser = await puppeteer_1.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=medium'],
                executablePath: executablePath || undefined,
            });
            console.log('Browser launched successfully');
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'domcontentloaded' });
            console.log('HTML content set, generating PDF...');
            const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' } });
            res.end(pdfBuffer);
        }
        catch (err) {
            console.error('PDF generation failed:', err);
            if (!res.headersSent) {
                res.status(500).send('PDF generation failed: ' + String(err));
            }
        }
        finally {
            if (browser) {
                try {
                    await browser.close();
                }
                catch { }
            }
        }
    }
    async get(req, id) {
        const data = await this.chats.findOne(this.userId(req), id);
        return { success: true, data };
    }
    async update(req, id, dto) {
        const data = await this.chats.update(this.userId(req), id, dto);
        return { success: true, data };
    }
    async delete(req, id) {
        const data = await this.chats.remove(this.userId(req), id);
        return { success: true, data };
    }
    async addMessage(req, id, dto) {
        const data = await this.chats.addMessage(this.userId(req), id, dto);
        return { success: true, data };
    }
    async removeMessage(req, id, messageId) {
        const data = await this.chats.removeMessage(this.userId(req), id, messageId);
        return { success: true, data };
    }
    async getMessagesWithEducationContext(req, id) {
        const data = await this.chats.getMessagesWithEducationContext(this.userId(req), id);
        return { success: true, data };
    }
    streamPracticeQuestions(req, chatId, messageId, difficulty, count, language) {
        const options = {};
        if (difficulty && ['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
            options.difficulty = difficulty;
        }
        if (count && !Number.isNaN(Number(count))) {
            options.count = Number(count);
        }
        if (language && ['auto', 'en', 'ar'].includes(language)) {
            options.language = language;
        }
        const userId = this.userId(req);
        return (0, rxjs_1.from)(this.practiceQuestions.generateForMessage(userId, chatId, messageId, options)).pipe((0, operators_1.mergeMap)((items) => {
            const total = items.length;
            if (!total) {
                return (0, rxjs_1.of)({ data: { type: 'done', total } });
            }
            return (0, rxjs_1.from)(items).pipe((0, operators_1.map)((question, index) => ({
                data: { type: 'question', index, total, question },
            })), (0, operators_1.concatWith)((0, rxjs_1.of)({ data: { type: 'done', total } })));
        }), (0, operators_1.catchError)((error) => {
            const message = (error === null || error === void 0 ? void 0 : error.message) || 'Failed to generate practice questions';
            if (error instanceof common_1.BadRequestException || error instanceof common_1.ForbiddenException || error instanceof common_1.NotFoundException) {
                return (0, rxjs_1.of)({ data: { type: 'error', message } });
            }
            return (0, rxjs_1.of)({ data: { type: 'error', message } });
        }));
    }
    async generatePracticeQuestions(req, chatId, messageId, dto) {
        const data = await this.practiceQuestions.generateForMessage(this.userId(req), chatId, messageId, dto);
        return { success: true, data };
    }
    async getPracticeQuestions(req, chatId, messageId, includeArchived) {
        const include = includeArchived === 'true';
        const data = await this.practiceQuestions.getQuestionsForMessage(this.userId(req), chatId, messageId, include);
        return { success: true, data };
    }
    async submitPracticeQuestion(req, questionId, dto) {
        const data = await this.practiceQuestions.submitAnswer(this.userId(req), questionId, {
            answer: dto.answer,
            selectedOptionIndex: dto.selectedOptionIndex,
        });
        return { success: true, data };
    }
    async updatePracticeQuestion(req, questionId, dto) {
        const data = await this.practiceQuestions.archiveQuestion(this.userId(req), questionId, dto.archived !== false);
        return { success: true, data };
    }
    async getPracticeStatistics(req) {
        const data = await this.practiceQuestions.getUserStatistics(this.userId(req));
        return { success: true, data };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_chat_dto_1.CreateChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('courses/recommendations'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('topic')),
    __param(2, (0, common_1.Query)('language')),
    __param(3, (0, common_1.Query)('count')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getCourseRecommendations", null);
__decorate([
    (0, common_1.Get)('search/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "searchMessages", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listByUser", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('messageId')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_chat_dto_1.UpdateChatDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_message_dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Delete)(':id/messages/:messageId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeMessage", null);
__decorate([
    (0, common_1.Get)(':id/messages/with-context'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessagesWithEducationContext", null);
__decorate([
    (0, common_1.Sse)(':id/messages/:messageId/practice-questions/stream'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Query)('difficulty')),
    __param(4, (0, common_1.Query)('count')),
    __param(5, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], ChatController.prototype, "streamPracticeQuestions", null);
__decorate([
    (0, common_1.Post)(':id/messages/:messageId/practice-questions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, generate_practice_questions_dto_1.GeneratePracticeQuestionsDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "generatePracticeQuestions", null);
__decorate([
    (0, common_1.Get)(':id/messages/:messageId/practice-questions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('messageId')),
    __param(3, (0, common_1.Query)('includeArchived')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getPracticeQuestions", null);
__decorate([
    (0, common_1.Post)('questions/:questionId/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_practice_question_dto_1.SubmitPracticeQuestionDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "submitPracticeQuestion", null);
__decorate([
    (0, common_1.Patch)('questions/:questionId/archive'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_practice_question_dto_1.UpdatePracticeQuestionDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updatePracticeQuestion", null);
__decorate([
    (0, common_1.Get)('practice/statistics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getPracticeStatistics", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        title_generator_service_1.TitleGeneratorService,
        users_service_1.UsersService,
        practice_question_service_1.PracticeQuestionService,
        course_recommendation_service_1.CourseRecommendationService])
], ChatController);
function buildOutline(content) {
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
    let title = lines[0] || 'Article';
    title = title.replace(/^[#>*\d\-\s]+/, '').slice(0, 100).replace(/[.!?]$/, '');
    const bulletRegex = /^(?:[-*•]|\d+\.)\s+/;
    const points = [];
    const bodyLines = [];
    for (const ln of lines) {
        if (bulletRegex.test(ln) && points.length < 12) {
            points.push(ln.replace(bulletRegex, '').trim());
        }
        else {
            bodyLines.push(ln);
        }
    }
    if (points.length < 3) {
        const sentences = content.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 30).slice(0, 10);
        while (points.length < 5 && sentences.length) {
            const s = sentences.shift();
            if (s)
                points.push(s);
        }
    }
    return { title, points, remaining: bodyLines.join('\n') };
}
function buildHtml({ title, generatedAt, dir, align, outline, sections, empty }) {
    const style = `
    <style>
      :root { --fg:#111; --muted:#666; --brand:#e11d48; }
      * { box-sizing: border-box; }
      html, body { margin:0; padding:0; }
      body { font-family: 'Segoe UI', 'Noto Naskh Arabic', Tahoma, Arial, Helvetica, sans-serif; color:var(--fg); direction:${dir}; }
      .container { padding: 12mm 10mm; }
      h1 { margin:0 0 6mm; font-size: 20pt; font-weight: 700; }
      .meta { color: var(--muted); font-size: 9pt; margin-bottom: 8mm; text-align:${align}; }
      .section-title { color: var(--brand); font-weight: 700; font-size: 12pt; margin: 8mm 0 3mm; text-transform: uppercase; letter-spacing: .3px; text-align:${align}; }
      ul { margin:0; padding-${dir === 'rtl' ? 'right' : 'left'}: 5mm; }
      li { margin: 2.5mm 0; line-height: 1.45; }
      p { margin: 3mm 0; line-height: 1.6; text-align:${align}; font-size: 11pt; }
      .footer { margin-top: 10mm; color: #888; font-size: 8.5pt; text-align:${align}; }
      .empty { color:#b91c1c; font-size:12pt; font-weight:600; }
    </style>
  `;
    const pointsHtml = outline.points.map(p => `<li>${escapeHtml(p)}</li>`).join('');
    const detailsParas = sections.details
        ? sections.details.split(/\n{2,}/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('')
        : '';
    const examplesHtml = sections.examples && sections.examples.length
        ? `<div class="section-title">${dir === 'rtl' ? 'أمثلة من الواقع' : 'Real Life Examples'}</div><ul>${sections.examples.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
        : '';
    const summaryHtml = sections.summary
        ? `<div class="section-title">${dir === 'rtl' ? 'ملخص' : 'Summary'}</div><p>${escapeHtml(sections.summary)}</p>`
        : '';
    return `<!DOCTYPE html>
  <html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${style}
      <title>${escapeHtml(title)}</title>
    </head>
    <body>
      <div class="container">
        <h1 style="text-align:${align}">${escapeHtml(title)}</h1>
        <div class="meta">${escapeHtml((dir === 'rtl' ? 'تم الإنشاء: ' : 'Generated: ') + generatedAt)}</div>
        ${empty ? `<p class="empty">${dir === 'rtl' ? 'لا يوجد رد من المساعد مناسب للتصدير.' : 'No assistant response available for export.'}</p>` : `
          <div class="section-title">${dir === 'rtl' ? 'أهم النقاط' : 'Key Points'}</div>
          <ul>${pointsHtml}</ul>
          ${summaryHtml}
          ${sections.details ? `<div class="section-title">${dir === 'rtl' ? 'التفاصيل' : 'Details'}</div>` : ''}
          ${detailsParas}
          ${examplesHtml}
          <div class="footer">${dir === 'rtl' ? 'تمت هيكلة المحتوى تلقائيًا من آخر رد للمساعد.' : 'Structured automatically from the last assistant response.'}</div>
        `}
      </div>
    </body>
  </html>`;
}
function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function deriveContextTitle(content) {
    if (!content)
        return null;
    const headingMatch = content.match(/^\s{0,3}#{1,3}\s+(.{3,80})$/m);
    if (headingMatch)
        return cleanTitleFragment(headingMatch[1]);
    const firstLine = content.split(/\n+/).map(l => l.trim()).find(l => l.length > 8) || '';
    if (firstLine)
        return cleanTitleFragment(firstLine.slice(0, 80));
    return null;
}
function cleanTitleFragment(t) {
    return t.replace(/[`*_#>\-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
}
//# sourceMappingURL=chat.controller.js.map