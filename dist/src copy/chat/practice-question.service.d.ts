import { Model } from 'mongoose';
import { ChatDocument } from './chat.schema';
import { PracticeDifficulty, PracticeQuestionDocument, PracticeQuestionType } from './practice-question.schema';
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
export declare class PracticeQuestionService {
    private readonly questions;
    private readonly chats;
    private readonly logger;
    private readonly endpoint;
    private readonly apiKey;
    constructor(questions: Model<PracticeQuestionDocument>, chats: Model<ChatDocument>);
    generateForMessage(userId: string, chatId: string, messageId: string, options?: GenerateOptions): Promise<{
        id: any;
        chatId: any;
        messageId: any;
        question: any;
        type: PracticeQuestionType;
        difficulty: PracticeDifficulty;
        options: any;
        explanation: any;
        language: any;
        autoGraded: any;
        archived: any;
        stats: {
            attempts: any;
            correctAttempts: any;
            accuracy: number | null;
        };
        createdAt: any;
        updatedAt: any;
        sourceSummary: any;
        sourceTitle: any;
    }[]>;
    getQuestionsForMessage(userId: string, chatId: string, messageId: string, includeArchived?: boolean): Promise<{
        id: any;
        chatId: any;
        messageId: any;
        question: any;
        type: PracticeQuestionType;
        difficulty: PracticeDifficulty;
        options: any;
        explanation: any;
        language: any;
        autoGraded: any;
        archived: any;
        stats: {
            attempts: any;
            correctAttempts: any;
            accuracy: number | null;
        };
        createdAt: any;
        updatedAt: any;
        sourceSummary: any;
        sourceTitle: any;
    }[]>;
    submitAnswer(userId: string, questionId: string, answer: {
        answer?: string;
        selectedOptionIndex?: number;
    }): Promise<SubmitResult>;
    archiveQuestion(userId: string, questionId: string, archived?: boolean): Promise<{
        id: any;
        chatId: any;
        messageId: any;
        question: any;
        type: PracticeQuestionType;
        difficulty: PracticeDifficulty;
        options: any;
        explanation: any;
        language: any;
        autoGraded: any;
        archived: any;
        stats: {
            attempts: any;
            correctAttempts: any;
            accuracy: number | null;
        };
        createdAt: any;
        updatedAt: any;
        sourceSummary: any;
        sourceTitle: any;
    }>;
    getQuestion(userId: string, questionId: string): Promise<{
        id: any;
        chatId: any;
        messageId: any;
        question: any;
        type: PracticeQuestionType;
        difficulty: PracticeDifficulty;
        options: any;
        explanation: any;
        language: any;
        autoGraded: any;
        archived: any;
        stats: {
            attempts: any;
            correctAttempts: any;
            accuracy: number | null;
        };
        createdAt: any;
        updatedAt: any;
        sourceSummary: any;
        sourceTitle: any;
    }>;
    getUserStatistics(userId: string): Promise<{
        difficulty: PracticeDifficulty;
        total: any;
        archived: any;
        attempts: any;
        correctAttempts: any;
        accuracy: number | null;
    }[]>;
    private loadChat;
    private normalizeDifficulty;
    private normalizeCount;
    private resolveLanguage;
    private estimateArabic;
    private generateQuestionsFromContent;
    private buildSystemPrompt;
    private buildUserPrompt;
    private extractQuestions;
    private toSanitizedQuestion;
    private normalizeType;
    private normalizeDifficultyLabel;
    private evaluateAnswer;
    private buildFallbackQuestions;
    private normalizeTrueFalseAnswers;
    private toBooleanLiteral;
    private toDto;
}
export {};
