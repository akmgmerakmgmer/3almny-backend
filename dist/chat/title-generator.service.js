"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TitleGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TitleGeneratorService = void 0;
const common_1 = require("@nestjs/common");
let TitleGeneratorService = TitleGeneratorService_1 = class TitleGeneratorService {
    constructor() {
        var _a;
        this.logger = new common_1.Logger(TitleGeneratorService_1.name);
        this.endpoint = ((_a = process.env.OPENAI_BASE_URL) === null || _a === void 0 ? void 0 : _a.replace(/\/$/, '')) || 'https://api.openai.com/v1';
        this.apiKey = process.env.OPENAI_API_KEY;
    }
    async generate(messages) {
        var _a, _b, _c, _d;
        const recent = messages.slice(-6);
        const joined = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        if (!this.apiKey) {
            const firstUser = [...messages].find(m => m.role === 'user' && m.content.trim().length > 12);
            return firstUser ? truncateTitle(firstUser.content) : null;
        }
        const prompt = `Create a very short (max 6 words) neutral, title-cased chat title summarizing the main topic. No quotes, no punctuation at end. If the content is generic greetings only respond with: New Chat.\n\nContext:\n${joined}\n\nTitle:`;
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
                        { role: 'system', content: 'You output only the title text.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 12,
                    temperature: 0.3,
                })
            });
            if (!res.ok) {
                this.logger.warn('Title generation failed: ' + res.status);
                return null;
            }
            const json = await res.json();
            const raw = ((_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || '';
            return sanitize(raw) || null;
        }
        catch (e) {
            this.logger.warn('Title generation error: ' + e.message);
            return null;
        }
    }
    async generateForContent(content) {
        var _a, _b, _c, _d;
        const text = (content || '').trim();
        if (!text)
            return null;
        if (!this.apiKey) {
            const line = text.split(/\n+/).map(l => l.trim()).find(l => l.length > 12) || text.slice(0, 80);
            return clampTitle(truncateTitle(line));
        }
        const prompt = `Create a VERY SHORT (max 4 words) descriptive, title-cased document title summarizing ONLY the content below. Absolutely no quotes, no trailing punctuation, no emojis. If content is greetings / too vague output: General Summary. Output ONLY the title text.\n\nContent:\n"""\n${text.slice(0, 6000)}\n"""\nTitle:`;
        try {
            const res = await fetch(this.endpoint + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You output only the title text.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 12,
                    temperature: 0.3,
                })
            });
            if (!res.ok)
                return truncateTitle(text);
            const json = await res.json();
            const raw = ((_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || '';
            const cleaned = clampTitle(sanitize(raw) || truncateTitle(text));
            return cleaned;
        }
        catch {
            return clampTitle(truncateTitle(text));
        }
    }
    async generateSections(rawContent, forceArabic = false) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const content = (rawContent || '').trim();
        if (!content) {
            return { summary: 'No content available to summarize.', examples: [], details: 'No content available for detailed explanation.' };
        }
        if (!this.apiKey) {
            const exampleCandidates = content.split(/(?<=[.!?])\s+/).filter(s => /\b(example|e\.g\.|for instance|for example)\b/i.test(s)).slice(0, 3);
            return {
                summary: 'LLM summary generation unavailable - API key not configured.',
                examples: exampleCandidates.length > 0 ? exampleCandidates : ['No examples available without LLM processing.'],
                details: content
            };
        }
        const languageInstruction = forceArabic
            ? '\n\nIMPORTANT: You must respond in Arabic language only. All JSON field values (summary, examples, details) must be written completely in Arabic.'
            : '';
        const prompt = `You will receive raw assistant output content.\nProduce a JSON object with three fields:\n1. summary: A comprehensive summary that captures ALL key points from the article/response without leaving any important information behind. Include all main concepts, conclusions, and essential details. Make it as detailed as needed to cover everything important.\n2. examples: An array of up to 3 concrete real-life examples that illustrate the concepts discussed in the content.\n3. details: A detailed explanation of the article/response content with comprehensive explanations and examples. Expand on the concepts, provide in-depth analysis, and include practical applications. Make it as thorough and detailed as necessary.${languageInstruction}\n\nReturn ONLY valid JSON.\n\nContent:\n"""\n${content.slice(0, 8000)}\n"""\n`;
        try {
            const res = await fetch(this.endpoint + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: forceArabic ? 'You output ONLY minified JSON like {"summary":"...","examples":["..."],"details":"..."}. Write all content in Arabic language.' : 'You output ONLY minified JSON like {"summary":"...","examples":["..."],"details":"..."}.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.4,
                })
            });
            if (!res.ok) {
                this.logger.warn('Section generation failed: ' + res.status);
                return { summary: 'Summary unavailable (generation failed).', examples: [], details: 'Details unavailable (generation failed).' };
            }
            const json = await res.json();
            const raw = ((_d = (_c = (_b = (_a = json === null || json === void 0 ? void 0 : json.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim()) || '{}';
            let parsed = {};
            try {
                parsed = JSON.parse(raw);
            }
            catch {
                parsed = {};
            }
            const summary = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : 'Summary unavailable.';
            const details = typeof parsed.details === 'string' && parsed.details.trim() ? parsed.details.trim() : 'Details unavailable.';
            let examples = Array.isArray(parsed.examples) ? parsed.examples.filter((e) => typeof e === 'string' && e.trim()).slice(0, 3) : [];
            if (!examples.length) {
                try {
                    const exLanguageInstruction = forceArabic ? ' You must write all examples in Arabic language only.' : '';
                    const exPrompt = `From the content below extract or, ONLY IF none truly exist, synthesize up to 3 realistic, concise real-life examples illustrating the key ideas. Return JSON {"examples":["..."]}. Avoid fabricating impossible facts. If you must synthesize, keep them generic and plausible.${exLanguageInstruction} Content:\n"""\n${content.slice(0, 4000)}\n"""`;
                    const exRes = await fetch(this.endpoint + '/chat/completions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                        body: JSON.stringify({
                            model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: forceArabic ? 'You output ONLY minified JSON like {"examples":["..."]}. Write all content in Arabic.' : 'You output ONLY minified JSON like {"examples":["..."]}.' },
                                { role: 'user', content: exPrompt }
                            ],
                            temperature: 0.5,
                        })
                    });
                    if (exRes.ok) {
                        const exJson = await exRes.json();
                        const exRaw = ((_h = (_g = (_f = (_e = exJson === null || exJson === void 0 ? void 0 : exJson.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h.trim()) || '{}';
                        let exParsed = {};
                        try {
                            exParsed = JSON.parse(exRaw);
                        }
                        catch {
                            exParsed = {};
                        }
                        if (Array.isArray(exParsed.examples)) {
                            examples = exParsed.examples.filter((e) => typeof e === 'string' && e.trim()).slice(0, 3);
                        }
                    }
                }
                catch { }
            }
            if (!examples.length) {
                const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                const candidate = sentences.filter(s => /\b(for example|for instance|e\.g\.|example of|such as)\b/i.test(s)).slice(0, 3);
                examples = candidate;
            }
            return { summary, examples, details };
        }
        catch (e) {
            this.logger.warn('Section generation error: ' + e.message);
            return { summary: 'Summary unavailable (error).', examples: [], details: 'Details unavailable (error).' };
        }
    }
};
exports.TitleGeneratorService = TitleGeneratorService;
exports.TitleGeneratorService = TitleGeneratorService = TitleGeneratorService_1 = __decorate([
    (0, common_1.Injectable)()
], TitleGeneratorService);
function sanitize(title) {
    let t = title.replace(/^['"\-\s]+|['"\s]+$/g, '');
    t = t.replace(/\.$/, '');
    if (/^new chat$/i.test(t))
        return 'New Chat';
    return toTitleCase(t);
}
function toTitleCase(str) {
    return str.replace(/\w[\w']*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
function truncateTitle(text) {
    const firstLine = text.split(/\n/)[0];
    const trimmed = firstLine.trim();
    return toTitleCase(trimmed || 'New Chat');
}
function clampTitle(t) {
    const words = t.split(/\s+/).filter(Boolean);
    let joined = words.join(' ');
    return joined;
}
//# sourceMappingURL=title-generator.service.js.map