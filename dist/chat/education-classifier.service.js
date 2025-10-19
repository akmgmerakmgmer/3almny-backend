"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EducationClassifierService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationClassifierService = void 0;
const common_1 = require("@nestjs/common");
let EducationClassifierService = EducationClassifierService_1 = class EducationClassifierService {
    constructor() {
        var _a;
        this.logger = new common_1.Logger(EducationClassifierService_1.name);
        this.endpoint = ((_a = process.env.OPENAI_BASE_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, '')) || 'https://api.openai.com/v1';
        this.apiKey = process.env.OPENAI_API_KEY;
    }
    fallback(text) {
        const lower = text.toLowerCase();
        const keywords = [
            'explain', 'define', 'describe', 'physics', 'chemistry', 'biology', 'history', 'algebra', 'calculus', 'grammar', 'theorem', 'proof', 'equation', 'experiment', 'lesson', 'topic', 'chapter', 'principle', 'concept', 'education', 'learning'
        ];
        return keywords.some(k => lower.includes(k));
    }
    async isEducational(text) {
        var _a, _b, _c, _d;
        if (!text || text.trim().length < 20)
            return false;
        if (!this.apiKey) {
            return this.fallback(text);
        }
        const prompt = `You are a classifier. Output ONLY YES or NO.\nText:\n"""${text.slice(0, 4000)}"""\nIs this text educational (teaches or explains academic, scientific, technical, historical, linguistic or learning content)? Answer:`;
        try {
            const res = await fetch(this.endpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You output only YES or NO.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1,
                    temperature: 0,
                })
            });
            if (!res.ok) {
                this.logger.warn(`Education classification API failed ${res.status}`);
                return this.fallback(text);
            }
            const json = await res.json();
            const answer = (_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim().toUpperCase();
            return answer === 'YES';
        }
        catch (e) {
            this.logger.warn('Education classification error, using fallback: ' + e.message);
            return this.fallback(text);
        }
    }
};
exports.EducationClassifierService = EducationClassifierService;
exports.EducationClassifierService = EducationClassifierService = EducationClassifierService_1 = __decorate([
    (0, common_1.Injectable)()
], EducationClassifierService);
//# sourceMappingURL=education-classifier.service.js.map