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
var CourseRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
let CourseRecommendationService = CourseRecommendationService_1 = class CourseRecommendationService {
    constructor(users) {
        var _a;
        this.users = users;
        this.logger = new common_1.Logger(CourseRecommendationService_1.name);
        this.endpoint = ((_a = process.env.OPENAI_BASE_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, '')) || 'https://api.openai.com/v1';
        this.apiKey = process.env.OPENAI_API_KEY;
    }
    async recommendCourses(userId, options = {}) {
        var _a, _b, _c, _d, _e;
        const { topic = '', language, count } = options;
        const preferredCount = Math.min(Math.max(count !== null && count !== void 0 ? count : 3, 2), 3);
        const educationContext = await this.users.getEducationSystemContext(userId).catch((error) => {
            this.logger.debug(`Failed to resolve education context: ${error instanceof Error ? error.message : error}`);
            return { context: null, requiresArabic: false };
        });
        const targetLanguage = language !== null && language !== void 0 ? language : (educationContext.requiresArabic ? 'ar' : 'en');
        if (!this.apiKey) {
            return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
        }
        const instructions = this.buildPrompt({
            targetLanguage,
            topic,
            count: preferredCount,
            educationContext: (_a = educationContext.context) !== null && _a !== void 0 ? _a : undefined,
        });
        try {
            const response = await fetch(`${this.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    temperature: 0.3,
                    messages: [
                        {
                            role: 'system',
                            content: targetLanguage === 'ar'
                                ? 'أنت مساعد تعليمي يقترح الدورات. يجب أن تعود باستجابة JSON فقط بصيغة {"courses":[{"title":"...","platform":"YouTube","url":"https://...","description":"...","language":"ar"}]} بدون أي نص إضافي.'
                                : 'You are an educational assistant. Respond ONLY with valid minified JSON like {"courses":[{"title":"...","platform":"YouTube","url":"https://...","description":"...","language":"en"}]} and no other text.',
                        },
                        {
                            role: 'user',
                            content: instructions,
                        },
                    ],
                    max_tokens: 900,
                }),
            });
            if (!response.ok) {
                this.logger.warn(`Course recommendation request failed with status ${response.status}`);
                return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
            }
            const json = await response.json();
            const content = (_e = (_d = (_c = (_b = json === null || json === void 0 ? void 0 : json.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.trim();
            if (!content) {
                this.logger.warn('Course recommendation response missing content');
                return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
            }
            let parsed;
            try {
                parsed = JSON.parse(content);
            }
            catch (error) {
                this.logger.warn(`Failed to parse course recommendation JSON: ${error instanceof Error ? error.message : error}`);
                return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
            }
            const courses = Array.isArray(parsed === null || parsed === void 0 ? void 0 : parsed.courses) ? parsed.courses : [];
            const sanitized = courses
                .filter((course) => Boolean(course) && typeof course === 'object')
                .map((course) => this.normalizeCourse(course, targetLanguage))
                .filter((course) => Boolean(course));
            if (!sanitized.length) {
                return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
            }
            return sanitized.slice(0, preferredCount);
        }
        catch (error) {
            this.logger.warn(`Course recommendation error: ${error instanceof Error ? error.message : error}`);
            return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
        }
    }
    normalizeCourse(raw, language) {
        const title = typeof raw.title === 'string' ? raw.title.trim() : '';
        const platform = typeof raw.platform === 'string' ? raw.platform.trim() : '';
        const url = typeof raw.url === 'string' ? raw.url.trim() : '';
        const description = typeof raw.description === 'string' ? raw.description.trim() : '';
        if (!title || !url) {
            return null;
        }
        const normalizedPlatform = platform || (url.includes('youtube') ? 'YouTube' : url.includes('udemy') ? 'Udemy' : 'Course');
        const secureUrl = url.startsWith('http://') ? url.replace(/^http:\/\//i, 'https://') : url;
        return {
            title,
            platform: normalizedPlatform,
            url: secureUrl,
            description: description || (language === 'ar' ? 'دورة تعليمية موصى بها.' : 'Recommended learning resource.'),
            language,
        };
    }
    buildPrompt(params) {
        const { targetLanguage, topic, count, educationContext } = params;
        const topicLine = topic ? (targetLanguage === 'ar' ? `الموضوع المطلوب: ${topic}.` : `Focus topic: ${topic}.`) : '';
        const contextLine = educationContext ? (targetLanguage === 'ar'
            ? `سياق المستخدم التعليمي: ${educationContext}`
            : `Learner context: ${educationContext}`) : '';
        const intro = targetLanguage === 'ar'
            ? 'اقترح دورات تعليمية بالفيديو تناسب طالباً في المدرسة. يجب أن تكون الدورات من YouTube أو Udemy فقط.'
            : 'Recommend video-based learning courses suitable for a K-12 learner. Courses must come from YouTube or Udemy only.';
        const countInstruction = targetLanguage === 'ar'
            ? `أعد بالضبط ${count} دورات بحد أقصى.`
            : `Return exactly ${count} courses at most.`;
        const languageInstruction = targetLanguage === 'ar'
            ? 'اكتب جميع الحقول باللغة العربية بما في ذلك الوصف.'
            : 'Write all fields in English, including descriptions.';
        const structureInstruction = targetLanguage === 'ar'
            ? 'تأكد أن كل عنصر يحتوي الحقول: title, platform (YouTube أو Udemy فقط), url, description, language.'
            : 'Ensure each item includes: title, platform (either YouTube or Udemy), url, description, language.';
        return [intro, topicLine, contextLine, countInstruction, languageInstruction, structureInstruction, 'أعد النتيجة بصيغة JSON فقط بدون أي نص خارجي.', 'Return the JSON only.'].join('\n');
    }
    fallbackRecommendations(language, topic, count) {
        const defaultsEn = [
            {
                title: 'Fundamentals of Math - Khan Academy Playlist',
                platform: 'YouTube',
                url: 'https://www.youtube.com/playlist?list=PLSQl0a2vh4HD7aldRn0l-a0Pb4C8R5t1X',
                description: 'Structured lessons covering middle school math fundamentals with practice problems.',
                language: 'en',
            },
            {
                title: 'Science Basics for Middle School',
                platform: 'YouTube',
                url: 'https://www.youtube.com/playlist?list=PLkh9EPEB0v5i2NOV-5-Zh6w5WAXj8Tz1a',
                description: 'Short concept videos that explain physics, chemistry, and biology topics for beginners.',
                language: 'en',
            },
            {
                title: 'Udemy: Complete English Grammar Course',
                platform: 'Udemy',
                url: 'https://www.udemy.com/course/complete-english-grammar-course/',
                description: 'Comprehensive English grammar lessons with downloadable worksheets and exercises.',
                language: 'en',
            },
        ];
        const defaultsAr = [
            {
                title: 'دورة الرياضيات المتكاملة للمرحلة الإعدادية',
                platform: 'YouTube',
                url: 'https://www.youtube.com/playlist?list=PL2PzW-rJj9HJMx1x64tZQDJd8ydmmio9c',
                description: 'شرح مبسط ومفصل لدروس الرياضيات الأساسية باللغة العربية مع أمثلة محلولة.',
                language: 'ar',
            },
            {
                title: 'أساسيات العلوم باللغة العربية',
                platform: 'YouTube',
                url: 'https://www.youtube.com/playlist?list=PL3aNtjfbZ8dRzCQXDpUe1koRaSP-L6e7y',
                description: 'فيديوهات قصيرة تشرح مفاهيم الفيزياء والكيمياء والأحياء بطريقة مبسطة.',
                language: 'ar',
            },
            {
                title: 'Udemy: دورة اللغة الإنجليزية من الصفر',
                platform: 'Udemy',
                url: 'https://www.udemy.com/course/english-grammar-arabic/',
                description: 'شرح قواعد اللغة الإنجليزية للمبتدئين باللغة العربية مع أمثلة وتمارين.',
                language: 'ar',
            },
        ];
        const pool = language === 'ar' ? defaultsAr : defaultsEn;
        if (topic) {
            const filtered = pool.filter((course) => course.title.toLowerCase().includes(topic.toLowerCase()));
            if (filtered.length >= 2) {
                return filtered.slice(0, count);
            }
        }
        return pool.slice(0, count);
    }
};
exports.CourseRecommendationService = CourseRecommendationService;
exports.CourseRecommendationService = CourseRecommendationService = CourseRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], CourseRecommendationService);
//# sourceMappingURL=course-recommendation.service.js.map