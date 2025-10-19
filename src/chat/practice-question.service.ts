import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './chat.schema';
import {
  PracticeDifficulty,
  PracticeQuestion,
  PracticeQuestionDocument,
  PracticeQuestionType,
} from './practice-question.schema';

interface GenerateOptions {
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  count?: number;
  language?: 'auto' | 'en' | 'ar';
  focus?: string;
}

interface SubmitResult {
  correct: boolean | null;
  evaluationAvailable: boolean;
  explanation?: string;
  correctOption?: number;
  acceptableAnswers?: string[];
  stats: {
    attempts: number;
    correctAttempts: number;
    accuracy: number | null;
  };
}

interface GeneratedQuestion {
  question: string;
  type: PracticeQuestionType;
  difficulty: PracticeDifficulty;
  options?: { label: string; value: string }[];
  correctOption?: number;
  acceptableAnswers: string[];
  explanation?: string;
  autoGraded: boolean;
}

interface SanitizedQuestion extends GeneratedQuestion {
  language: 'en' | 'ar';
  sourceSummary?: string | null;
  sourceTitle?: string | null;
}

@Injectable()
export class PracticeQuestionService {
  private readonly logger = new Logger(PracticeQuestionService.name);
  private readonly endpoint = process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  constructor(
    @InjectModel(PracticeQuestion.name)
    private readonly questions: Model<PracticeQuestionDocument>,
    @InjectModel(Chat.name)
    private readonly chats: Model<ChatDocument>,
  ) {}

  async generateForMessage(
    userId: string,
    chatId: string,
    messageId: string,
    options: GenerateOptions = {},
  ) {
    const chat = await this.loadChat(userId, chatId);
    const message = chat.messages.find((m: any) => m.id === messageId);
    if (!message) throw new NotFoundException('Message not found');
    if (message.role !== 'assistant') {
      throw new BadRequestException('Practice questions can only be generated from assistant responses.');
    }
    if (!message.meta?.articleEligible) {
      throw new BadRequestException('Practice questions require an exportable assistant response.');
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
      messageTitle: message.meta?.derivedTitle || null,
    });

    let filtered = generated.filter((question) => difficulty === 'mixed' || question.difficulty === difficulty);

    if (!filtered.length && generated.length) {
      filtered = generated.slice(0, count);
    }

    if (!filtered.length) {
      filtered = this.buildFallbackQuestions(message.content, count, language, message.meta?.derivedTitle || null, difficulty);
    }

    const limited = filtered.slice(0, count);

    if (!limited.length) {
      throw new BadRequestException('Unable to generate practice questions for this response.');
    }

    const docs = limited.map((q) => ({
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
      sourceSummary: q.sourceSummary ?? null,
      sourceTitle: q.sourceTitle ?? null,
    }));

    const created = await this.questions.insertMany(docs);
    return created.map((doc) => this.toDto(doc as PracticeQuestionDocument));
  }

  async getQuestionsForMessage(userId: string, chatId: string, messageId: string, includeArchived = false) {
    const chat = await this.loadChat(userId, chatId);
    const query: Record<string, any> = {
      chatId: chat._id,
      userId: chat.userId,
      messageId,
    };
    if (!includeArchived) query.archived = false;
    const results = await this.questions.find(query).sort({ createdAt: -1 }).lean();
    return results.map((doc) => this.toDto(doc as PracticeQuestionDocument));
  }

  async submitAnswer(userId: string, questionId: string, answer: { answer?: string; selectedOptionIndex?: number }): Promise<SubmitResult> {
    const question = await this.questions.findById(questionId);
    if (!question) throw new NotFoundException('Practice question not found');
    if (question.userId.toString() !== userId) {
      throw new ForbiddenException('You cannot answer questions you do not own.');
    }
    if (question.archived) {
      throw new BadRequestException('This question has been archived.');
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
      explanation: question.explanation ?? undefined,
      correctOption: question.correctOption ?? undefined,
      acceptableAnswers: question.acceptableAnswers?.length ? question.acceptableAnswers : undefined,
      stats: {
        attempts: question.attempts,
        correctAttempts: question.correctAttempts,
        accuracy,
      },
    };
  }

  async archiveQuestion(userId: string, questionId: string, archived = true) {
    const question = await this.questions.findById(questionId);
    if (!question) throw new NotFoundException('Practice question not found');
    if (question.userId.toString() !== userId) {
      throw new ForbiddenException('You cannot modify questions you do not own.');
    }
    question.archived = archived;
    await question.save();
    return this.toDto(question);
  }

  async getQuestion(userId: string, questionId: string) {
    const question = await this.questions.findById(questionId);
    if (!question) throw new NotFoundException('Practice question not found');
    if (question.userId.toString() !== userId) {
      throw new ForbiddenException('You cannot view questions you do not own.');
    }
    return this.toDto(question);
  }

  async getUserStatistics(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return [];
    const pipeline = [
      { $match: { userId: new Types.ObjectId(userId) } },
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
      difficulty: row._id as PracticeDifficulty,
      total: row.total,
      archived: row.archived,
      attempts: row.attempts,
      correctAttempts: row.correctAttempts,
      accuracy: row.attempts > 0 ? Number((row.correctAttempts / row.attempts).toFixed(2)) : null,
    }));
  }

  private async loadChat(userId: string, chatId: string): Promise<ChatDocument> {
    if (!Types.ObjectId.isValid(chatId)) throw new NotFoundException('Chat not found');
    const chat = await this.chats.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this chat.');
    }
    return chat;
  }

  private normalizeDifficulty(diff?: string): 'easy' | 'medium' | 'hard' | 'mixed' {
    switch ((diff || 'medium').toLowerCase()) {
      case 'easy':
      case 'medium':
      case 'hard':
        return diff as 'easy' | 'medium' | 'hard';
      case 'mixed':
      default:
        return 'mixed';
    }
  }

  private normalizeCount(count?: number): number {
    if (!count || Number.isNaN(count)) return 5;
    return Math.min(Math.max(Math.floor(count), 1), 20);
  }

  private resolveLanguage(
    preference: 'auto' | 'en' | 'ar' | undefined,
    content: string,
    meta?: Record<string, any>,
  ): 'en' | 'ar' {
    if (preference === 'en' || preference === 'ar') return preference;
    if (meta?.educationSystemContext?.requiresArabic) return 'ar';
    if (typeof meta?.language === 'string') {
      const normalized = meta.language.toLowerCase();
      if (normalized === 'ar') return 'ar';
      if (normalized === 'en') return 'en';
    }
    const arabicRatio = this.estimateArabic(content);
    if (arabicRatio > 0.25) return 'ar';
    return 'en';
  }

  private estimateArabic(content: string): number {
    if (!content) return 0;
    const arabicChars = content.match(/[\u0600-\u06FF]/g)?.length || 0;
    return arabicChars / Math.max(content.length, 1);
  }

  private async generateQuestionsFromContent(params: {
    content: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    count: number;
    language: 'en' | 'ar';
    focus?: string;
    messageTitle?: string | null;
  }): Promise<SanitizedQuestion[]> {
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
      const json: any = await response.json();
      const raw = json?.choices?.[0]?.message?.content ?? '';
      const parsed = this.extractQuestions(raw, difficulty);
      if (!parsed.length) {
        this.logger.warn('Practice question generation returned empty payload. Using fallback.');
        return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
      }
      return parsed.map((q) => ({ ...q, language }));
    } catch (error) {
      this.logger.error('Practice question generation error', error as Error);
      return this.buildFallbackQuestions(content, count, language, messageTitle, difficulty);
    }
  }

  private buildSystemPrompt(language: 'en' | 'ar'): string {
    const base =
      'You are an experienced teacher creating rigorous yet encouraging practice questions. Respond ONLY with minified JSON that matches this TypeScript type: {"questions":[{"question":string,"type":"multiple-choice"|"true-false","difficulty":"easy"|"medium"|"hard","options?":string[],"correctOption?":number,"answers?":string[],"explanation":string,"autoGraded":boolean}]}. Do not create question types other than multiple-choice or true-false. You MUST obey the user instructions about the exact number of questions and the required difficulty labels. For multiple choice, provide exactly 4 distinct options and the correctOption index (0-based). For true-false, omit options but include answers with "true" or "false". If you cannot auto-grade, set autoGraded false and provide guidance in the explanation.';
    if (language === 'ar') {
      return (
        base +
        ' Write all question text, options, answers, and explanations in Arabic. Keep JSON keys in English.'
      );
    }
    return base + ' Write every field in clear English.';
  }

  private buildUserPrompt(params: {
    content: string;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    count: number;
    focus?: string;
    language: 'en' | 'ar';
    messageTitle?: string | null;
  }): string {
    const { content, difficulty, count, focus, language, messageTitle } = params;
    const baseTitle = messageTitle || (language === 'ar' ? 'رد تعليمي' : 'Educational response');
    const diffInstruction =
      difficulty === 'mixed'
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

  private extractQuestions(raw: string, requestedDifficulty: 'easy' | 'medium' | 'hard' | 'mixed'): SanitizedQuestion[] {
    if (!raw) return [];
    let jsonText = raw.trim();
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      jsonText = braceMatch[0];
    }
    try {
      const data = JSON.parse(jsonText);
      const questions: any[] = Array.isArray(data?.questions) ? data.questions : [];
      return questions
        .map((item) => this.toSanitizedQuestion(item, requestedDifficulty))
        .filter((q): q is SanitizedQuestion => !!q);
    } catch {
      return [];
    }
  }

  private toSanitizedQuestion(entry: any, requestedDifficulty: 'easy' | 'medium' | 'hard' | 'mixed' = 'mixed'): SanitizedQuestion | null {
    if (!entry || typeof entry !== 'object') return null;
    const question = String(entry.question ?? '').trim();
    if (!question) return null;
    const type: PracticeQuestionType = this.normalizeType(entry.type);
    const difficulty: PracticeDifficulty = requestedDifficulty !== 'mixed'
      ? requestedDifficulty
      : this.normalizeDifficultyLabel(entry.difficulty ?? 'medium');
    const explanation = typeof entry.explanation === 'string' ? entry.explanation.trim() : undefined;

    let options: { label: string; value: string }[] | undefined;
    let correctOption: number | undefined;
    let acceptableAnswers: string[] = [];
    let autoGraded = entry.autoGraded === false ? false : true;

    if (type === 'multiple-choice') {
      const rawOptions: any[] = Array.isArray(entry.options) ? entry.options : [];
      const normalized = rawOptions
        .map((opt: any) => String(opt ?? '').trim())
        .filter((text: string) => !!text);
      if (!normalized.length) return null;
      const limited = normalized.slice(0, 4);
      if (limited.length < 2) return null;
      options = limited.map((text: string, index: number) => ({
        label: String.fromCharCode(65 + index) + '.',
        value: text,
      }));
      const candidate = typeof entry.correctOption === 'number' ? Math.floor(entry.correctOption) : 0;
      correctOption = candidate >= 0 && candidate < options.length ? candidate : 0;
      acceptableAnswers = Array.isArray(entry.answers)
        ? entry.answers.map((a: any) => String(a ?? '').trim()).filter((a: string) => !!a)
        : [];
    } else {
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

  private normalizeType(value: any): PracticeQuestionType {
    const normalized = (value || '').toString().toLowerCase();
    if (normalized === 'true-false' || normalized === 'true_false' || normalized === 'truefalse') {
      return 'true-false';
    }
    return 'multiple-choice';
  }

  private normalizeDifficultyLabel(value: any): PracticeDifficulty {
    const normalized = (value || '').toString().toLowerCase();
    if (normalized === 'easy' || normalized === 'hard') return normalized;
    if (normalized === 'medium' || normalized === 'moderate') return 'medium';
    return 'medium';
  }

  private evaluateAnswer(
    question: PracticeQuestionDocument,
    body: { answer?: string; selectedOptionIndex?: number },
  ): { correct: boolean | null; available: boolean } {
    if (!question.autoGraded) {
      return { correct: null, available: false };
    }
    if (question.type === 'multiple-choice') {
      if (typeof body.selectedOptionIndex !== 'number') {
        throw new BadRequestException('selectedOptionIndex is required for multiple choice questions.');
      }
      const isCorrect = question.correctOption === body.selectedOptionIndex;
      return { correct: isCorrect, available: true };
    }
    if (question.type === 'true-false') {
      const provided = (body.answer ?? '').toString().trim().toLowerCase();
      if (!provided) {
        throw new BadRequestException('Answer is required for true/false questions.');
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

  private buildFallbackQuestions(
    content: string,
    count: number,
    language: 'en' | 'ar',
    messageTitle: string | null | undefined,
    requestedDifficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  ): SanitizedQuestion[] {
    const baselineQuestion =
      language === 'ar'
        ? 'صحيح أم خطأ: الفقرة تناقش فكرة أو مفهوماً واحداً بوضوح.'
        : 'True or False: The passage focuses on explaining a single core concept.';
    const summaryPrompt = content?.trim().slice(0, 250) || '';
    const fallbackDifficulty: PracticeDifficulty = requestedDifficulty !== 'mixed' ? requestedDifficulty : 'medium';
    const question: SanitizedQuestion = {
      question: baselineQuestion,
      type: 'true-false',
      difficulty: fallbackDifficulty,
      options: undefined,
      correctOption: undefined,
      acceptableAnswers: [],
      explanation:
        language === 'ar'
          ? 'يمكنك استخدام هذا السؤال للمراجعة الذاتية، ولن يتم تقييم الإجابة تلقائياً في الوضع الاحتياطي.'
          : 'Use this prompt for self-review; automatic grading is unavailable in the fallback mode.',
      autoGraded: false,
      language,
      sourceSummary: summaryPrompt || null,
      sourceTitle: messageTitle || null,
    };
    return Array.from({ length: count }, () => ({ ...question }));
  }

  private normalizeTrueFalseAnswers(entry: any): string[] {
    const values: string[] = [];
    const append = (value: any) => {
      const literal = this.toBooleanLiteral(value);
      if (literal) values.push(literal);
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

  private toBooleanLiteral(value: any): 'true' | 'false' | null {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return null;
  if (['true', 't', 'yes', '1', 'صحيح', 'صح'].includes(normalized)) return 'true';
  if (['false', 'f', 'no', '0', 'خطأ', 'خطا', 'خاطئ'].includes(normalized)) return 'false';
    return null;
  }

  private toDto(doc: PracticeQuestionDocument | (PracticeQuestion & { _id: Types.ObjectId })) {
    const plain = typeof (doc as any).toObject === 'function' ? (doc as any).toObject() : doc;
    const accuracy = plain.attempts > 0 ? Number((plain.correctAttempts / plain.attempts).toFixed(2)) : null;
    return {
      id: plain._id.toString(),
      chatId: plain.chatId.toString(),
      messageId: plain.messageId,
      question: plain.question,
      type: plain.type as PracticeQuestionType,
      difficulty: plain.difficulty as PracticeDifficulty,
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
}
