import { UsersService } from './users.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<{
        user: null;
    } | {
        user: import("./mappers/public-user.mapper").PublicUserDto;
    }>;
    updatePreferences(req: any, dto: UpdateUserPreferencesDto): Promise<{
        user: import("./mappers/public-user.mapper").PublicUserDto;
    }>;
    getEducationContext(req: any): Promise<{
        context: string | null;
        requiresArabic: boolean;
    }>;
    getBookmarks(req: any, q?: string, offset?: string, limit?: string): Promise<{
        bookmarks: any[];
        total: number;
        offset: number;
        limit: number;
        hasMore: boolean;
    }>;
    addBookmark(req: any, dto: CreateBookmarkDto): Promise<any>;
    removeBookmark(req: any, bookmarkId: string): Promise<{
        success: boolean;
    }>;
    getStudyRecords(req: any, subject?: string, grade?: string, offset?: string, limit?: string): Promise<{
        records: any[];
        total: number;
        totalMinutes: any;
        offset: number;
        limit: number;
        hasMore: boolean;
        filteredTotal: number;
        filteredTotalMinutes: any;
    }>;
    getRecordsFilters(req: any): Promise<{
        subjects: string[];
        totalRecords: number;
    }>;
    addStudyRecord(req: any, dto: CreateStudyRecordDto): Promise<{
        record: any;
    }>;
    removeStudyRecord(req: any, recordId: string): Promise<{
        success: boolean;
    }>;
}
