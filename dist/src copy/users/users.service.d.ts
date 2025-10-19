import { Model } from 'mongoose';
import { UserDocument } from './user.entity';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
export declare class UsersService {
    private readonly userModel;
    constructor(userModel: Model<UserDocument>);
    private toBookmarkPlain;
    private sanitizeBookmarkContent;
    private toStudyRecordPlain;
    createLocal(username: string, email: string, password: string): Promise<UserDocument>;
    createGoogle(googleId: string, email: string, username: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument | null>;
    findById(id: string): Promise<UserDocument | null>;
    validateLocal(email: string, password: string): Promise<UserDocument>;
    updatePreferences(userId: string, dto: UpdateUserPreferencesDto): Promise<UserDocument>;
    getBookmarks(userId: string, options?: {
        query?: string;
        offset?: number;
        limit?: number;
    }): Promise<{
        bookmarks: any[];
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
    }>;
    addBookmark(userId: string, dto: CreateBookmarkDto): Promise<any>;
    removeBookmark(userId: string, bookmarkId: string): Promise<void>;
    getStudyRecords(userId: string, options?: {
        subject?: string;
        grade?: string;
        offset?: number;
        limit?: number;
    }): Promise<{
        records: any[];
        total: number;
        totalMinutes: any;
        offset: number;
        limit: number;
        hasMore: boolean;
        filteredTotal: number;
        filteredTotalMinutes: any;
    }>;
    addStudyRecord(userId: string, dto: CreateStudyRecordDto): Promise<any>;
    removeStudyRecord(userId: string, recordId: string): Promise<void>;
    getRecordsFilters(userId: string): Promise<{
        subjects: string[];
        totalRecords: number;
    }>;
    getEducationSystemContext(userId: string): Promise<{
        context: string | null;
        requiresArabic: boolean;
    }>;
}
