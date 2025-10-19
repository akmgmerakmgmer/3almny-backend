import { Document, Types } from 'mongoose';
export type UserDocument = User & Document;
export declare class BookmarkEntry {
    id: string;
    chatId?: string | null;
    messageId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    meta?: Record<string, any>;
    savedAt: Date;
}
export declare const BookmarkEntrySchema: import("mongoose").Schema<BookmarkEntry, import("mongoose").Model<BookmarkEntry, any, any, any, Document<unknown, any, BookmarkEntry, any, {}> & BookmarkEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, BookmarkEntry, Document<unknown, {}, import("mongoose").FlatRecord<BookmarkEntry>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<BookmarkEntry> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class StudyRecordEntry {
    id: string;
    startedAt: Date;
    endedAt: Date;
    subject: string;
    timeSpentMinutes: number;
}
export declare const StudyRecordEntrySchema: import("mongoose").Schema<StudyRecordEntry, import("mongoose").Model<StudyRecordEntry, any, any, any, Document<unknown, any, StudyRecordEntry, any, {}> & StudyRecordEntry & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StudyRecordEntry, Document<unknown, {}, import("mongoose").FlatRecord<StudyRecordEntry>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<StudyRecordEntry> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare enum EducationSystem {
    PRIVATE_ARABIC = "private_arabic",
    EXPERIMENTAL = "experimental",
    AZHAR = "azhar",
    INTERNATIONAL = "international",
    NATIONAL = "national"
}
export declare enum Grade {
    GRADE_1 = "grade_1",
    GRADE_2 = "grade_2",
    GRADE_3 = "grade_3",
    GRADE_4 = "grade_4",
    GRADE_5 = "grade_5",
    GRADE_6 = "grade_6",
    GRADE_7 = "grade_7",
    GRADE_8 = "grade_8",
    GRADE_9 = "grade_9",
    GRADE_10 = "grade_10",
    GRADE_11 = "grade_11",
    GRADE_12 = "grade_12",
    YEAR_7 = "year_7",
    YEAR_8 = "year_8",
    YEAR_9 = "year_9",
    YEAR_10 = "year_10",
    YEAR_11 = "year_11",
    YEAR_12 = "year_12",
    YEAR_13 = "year_13"
}
export declare enum Subject {
    ARABIC = "arabic",
    ENGLISH = "english",
    MATH = "math",
    SCIENCE = "science",
    RELIGION = "religion",
    SOCIAL = "social",
    SECOND_LANG = "second_lang",
    PHYSICS = "physics",
    CHEMISTRY = "chemistry",
    BIOLOGY = "biology",
    HISTORY = "history",
    GEOGRAPHY = "geography",
    PHILOSOPHY = "philosophy",
    MATHS = "maths",
    ICT = "ict",
    BUSINESS = "business",
    MATH_A = "math_a",
    PHYSICS_A = "physics_a",
    CHEMISTRY_A = "chemistry_a",
    BIOLOGY_A = "biology_a",
    BUSINESS_A = "business_a",
    QURAN = "quran",
    FIQH = "fiqh",
    HADITH = "hadith"
}
export declare class User {
    username: string;
    email: string;
    passwordHash: string;
    provider: 'local' | 'google';
    googleId?: string;
    educationSystem?: EducationSystem | null;
    grade?: Grade | null;
    subject?: Subject | null;
    bookmarks: BookmarkEntry[];
    records: StudyRecordEntry[];
    createdAt: Date;
    updatedAt?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
