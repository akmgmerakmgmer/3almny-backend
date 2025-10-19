import { Document, Types } from 'mongoose';
export type PracticeQuestionDocument = PracticeQuestion & Document;
export type PracticeQuestionType = 'multiple-choice' | 'true-false';
export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export declare class PracticeQuestion {
    chatId: Types.ObjectId;
    userId: Types.ObjectId;
    messageId: string;
    difficulty: PracticeDifficulty;
    type: PracticeQuestionType;
    question: string;
    options?: {
        label: string;
        value: string;
    }[];
    correctOption?: number;
    acceptableAnswers: string[];
    explanation?: string;
    autoGraded: boolean;
    archived: boolean;
    attempts: number;
    correctAttempts: number;
    language: 'en' | 'ar';
    sourceSummary?: string | null;
    sourceTitle?: string | null;
}
export declare const PracticeQuestionSchema: import("mongoose").Schema<PracticeQuestion, import("mongoose").Model<PracticeQuestion, any, any, any, Document<unknown, any, PracticeQuestion, any, {}> & PracticeQuestion & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PracticeQuestion, Document<unknown, {}, import("mongoose").FlatRecord<PracticeQuestion>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PracticeQuestion> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
