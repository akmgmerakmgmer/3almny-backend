import { Injectable, ConflictException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, EducationSystem, Grade, Subject, BookmarkEntry, StudyRecordEntry } from './user.entity';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  private toBookmarkPlain(entry: BookmarkEntry | (BookmarkEntry & { toObject?: () => any })): any {
    const plain: any = typeof (entry as any)?.toObject === 'function' ? (entry as any).toObject() : entry;
    const serialized = {
      id: plain.id ?? plain._id?.toString?.() ?? new Types.ObjectId().toString(),
      chatId: plain.chatId ?? null,
      messageId: plain.messageId,
      role: plain.role,
      content: plain.content,
      meta: plain.meta ?? {},
      savedAt:
        plain.savedAt instanceof Date
          ? plain.savedAt.toISOString()
          : new Date(plain.savedAt).toISOString(),
    };
    return serialized;
  }

  private sanitizeBookmarkContent(content: string): string {
    if (!content) return '';
    const trimmed = content.trim();
    const limit = 6000;
    if (trimmed.length <= limit) return trimmed;
    return `${trimmed.slice(0, limit - 3)}...`;
  }

  private toStudyRecordPlain(entry: StudyRecordEntry | (StudyRecordEntry & { toObject?: () => any })): any {
    const plain: any = typeof (entry as any)?.toObject === 'function' ? (entry as any).toObject() : entry;
    return {
      id: plain.id ?? plain._id?.toString?.() ?? new Types.ObjectId().toString(),
      startedAt: (plain.startedAt instanceof Date ? plain.startedAt : new Date(plain.startedAt)).toISOString(),
      endedAt: (plain.endedAt instanceof Date ? plain.endedAt : new Date(plain.endedAt)).toISOString(),
      subject: plain.subject,
      timeSpentMinutes: typeof plain.timeSpentMinutes === 'number' ? plain.timeSpentMinutes : Number(plain.timeSpentMinutes) || 0,
    };
  }

  async createLocal(username: string, email: string, password: string): Promise<UserDocument> {
    const exists = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
    if (exists) throw new ConflictException('Email already in use');
    const hash = await bcrypt.hash(password, 10);
    const created = new this.userModel({
      username,
      email: email.toLowerCase(),
      passwordHash: hash,
      provider: 'local',
    });
    return created.save();
  }

  async createGoogle(googleId: string, email: string, username: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ googleId });
    if (user) return user;
    const emailTaken = await this.userModel.findOne({ email: email.toLowerCase() }).lean();
    if (emailTaken) throw new ConflictException('Email already in use');
    user = new this.userModel({
      username,
      email: email.toLowerCase(),
      passwordHash: '',
      provider: 'google',
      googleId,
    });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async validateLocal(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOne({ email: email.toLowerCase(), provider: 'local' })
      .select('+passwordHash');
    if (!user) throw new NotFoundException('EMAIL_NOT_FOUND');
    const valid = await bcrypt.compare(password, user.passwordHash || '');
    if (!valid) throw new UnauthorizedException('INCORRECT_PASSWORD');
    return user;
  }

  async updatePreferences(userId: string, dto: UpdateUserPreferencesDto): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    if (dto.educationSystem !== undefined) {
      user.educationSystem = dto.educationSystem;
    }
    
    if (dto.grade !== undefined) {
      user.grade = dto.grade;
    }

    if (dto.subject !== undefined) {
      user.subject = dto.subject;
    }
    
    return user.save();
  }

  async getBookmarks(
    userId: string,
    options?: { query?: string; offset?: number; limit?: number }
  ) {
    const user = await this.userModel.findById(userId).select('bookmarks');
    if (!user) throw new NotFoundException('User not found');
    let list = (user.bookmarks ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const aTime = (a.savedAt instanceof Date ? a.savedAt : new Date(a.savedAt)).getTime();
        const bTime = (b.savedAt instanceof Date ? b.savedAt : new Date(b.savedAt)).getTime();
        return bTime - aTime;
      })
      .map(entry => this.toBookmarkPlain(entry));

    const query = options?.query?.trim().toLowerCase();
    if (query) {
      list = list.filter(entry => {
        const text = `${entry.content || ''} ${(entry.meta?.title as string) || ''}`.toLowerCase();
        return text.includes(query);
      });
    }

  const total = list.length;
  const limitCandidate = options?.limit ?? 50;
  const safeLimit = Math.min(Math.max(limitCandidate, 1), 100);
    const offsetCandidate = options?.offset ?? 0;
    const safeOffset = Math.max(offsetCandidate, 0);

    const paginated = list.slice(safeOffset, safeOffset + safeLimit);

    return {
      bookmarks: paginated,
      total,
      offset: safeOffset,
      limit: safeLimit,
      hasMore: safeOffset + safeLimit < total,
    };
  }

  async addBookmark(userId: string, dto: CreateBookmarkDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.bookmarks) {
      (user as any).bookmarks = [];
    }

    const meta = dto.meta && typeof dto.meta === 'object' && !Array.isArray(dto.meta) ? dto.meta : {};
    const sanitizedContent = this.sanitizeBookmarkContent(dto.content || '');
    const now = new Date();
    const existing = (user.bookmarks as any[]).find(b => b.messageId === dto.messageId);
    let target: any;
    if (existing) {
      existing.chatId = dto.chatId ?? null;
      existing.role = dto.role;
      existing.content = sanitizedContent;
      existing.meta = meta;
      existing.savedAt = now;
      target = existing;
    } else {
      const entry = {
        id: new Types.ObjectId().toString(),
        chatId: dto.chatId ?? null,
        messageId: dto.messageId,
        role: dto.role,
        content: sanitizedContent,
        meta,
        savedAt: now,
      };
      (user.bookmarks as any[]).push(entry);
      target = entry;
    }
    user.markModified('bookmarks');
    await user.save();
    return this.toBookmarkPlain(target);
  }

  async removeBookmark(userId: string, bookmarkId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.bookmarks || user.bookmarks.length === 0) return;
    const idx = (user.bookmarks as any[]).findIndex(b => {
      const plainId = b.id ?? b._id?.toString?.();
      return plainId === bookmarkId;
    });
    if (idx === -1) return;
    (user.bookmarks as any[]).splice(idx, 1);
    user.markModified('bookmarks');
    await user.save();
  }

  async getStudyRecords(
    userId: string,
    options?: { subject?: string; grade?: string; offset?: number; limit?: number }
  ) {
    const user = await this.userModel.findById(userId).select('records');
    if (!user) throw new NotFoundException('User not found');
    
    let records = (user.records ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const aTime = (a.startedAt instanceof Date ? a.startedAt : new Date(a.startedAt)).getTime();
        const bTime = (b.startedAt instanceof Date ? b.startedAt : new Date(b.startedAt)).getTime();
        return bTime - aTime;
      })
      .map(entry => this.toStudyRecordPlain(entry));

    // Filter by subject if provided
    if (options?.subject && options.subject !== 'all') {
      records = records.filter(record => record.subject === options.subject);
    }

    // Note: Grade filtering would require storing grade with each record
    // For now, we'll skip grade filtering in the backend since subjects are tied to grades
    // The frontend can handle this logic

    const total = records.length;
    const totalMinutes = records.reduce((sum: number, item: any) => sum + (item.timeSpentMinutes || 0), 0);

    // Apply pagination
    const limitCandidate = options?.limit ?? 20;
    const safeLimit = Math.min(Math.max(limitCandidate, 1), 100);
    const offsetCandidate = options?.offset ?? 0;
    const safeOffset = Math.max(offsetCandidate, 0);

    const paginated = records.slice(safeOffset, safeOffset + safeLimit);
    const paginatedTotalMinutes = paginated.reduce((sum: number, item: any) => sum + (item.timeSpentMinutes || 0), 0);

    return {
      records: paginated,
      total,
      totalMinutes,
      offset: safeOffset,
      limit: safeLimit,
      hasMore: safeOffset + safeLimit < total,
      filteredTotal: records.length,
      filteredTotalMinutes: totalMinutes,
    };
  }

  async addStudyRecord(userId: string, dto: CreateStudyRecordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const start = new Date(dto.startedAt);
    const end = new Date(dto.endedAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end time');
    }
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('End time must be after start time');
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMinutes <= 0) {
      throw new BadRequestException('Study session must be at least one minute long');
    }
    const subject = dto.subject.trim();
    if (!subject) {
      throw new BadRequestException('Subject is required');
    }
    const record: StudyRecordEntry = {
      id: new Types.ObjectId().toString(),
      startedAt: start,
      endedAt: end,
      subject,
      timeSpentMinutes: durationMinutes,
    } as any;

    if (!Array.isArray((user as any).records)) {
      (user as any).records = [];
    }

    (user.records as any[]).push(record);
    user.markModified('records');
    await user.save();
    return this.toStudyRecordPlain(record);
  }

  async removeStudyRecord(userId: string, recordId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.records || user.records.length === 0) return;
    const idx = (user.records as any[]).findIndex(entry => {
      const plainId = entry.id ?? entry._id?.toString?.();
      return plainId === recordId;
    });
    if (idx === -1) return;
    (user.records as any[]).splice(idx, 1);
    user.markModified('records');
    await user.save();
  }

  async getRecordsFilters(userId: string) {
    const user = await this.userModel.findById(userId).select('records');
    if (!user) throw new NotFoundException('User not found');
    
    const records = (user.records ?? []).map(entry => this.toStudyRecordPlain(entry));
    
    // Get unique subjects
    const subjectsSet = new Set<string>();
    records.forEach(record => {
      if (record.subject) {
        subjectsSet.add(record.subject);
      }
    });
    
    const subjects = Array.from(subjectsSet).sort();
    
    return {
      subjects,
      totalRecords: records.length,
    };
  }

  async getEducationSystemContext(userId: string): Promise<{ context: string | null; requiresArabic: boolean }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.educationSystem) return { context: null, requiresArabic: false };

    // Define which education systems require Arabic responses
    const arabicRequiredSystems = [
      EducationSystem.PRIVATE_ARABIC,
      EducationSystem.AZHAR,
      EducationSystem.NATIONAL
    ];
    
    const requiresArabic = arabicRequiredSystems.includes(user.educationSystem);

    const systemDescriptions = {
      [EducationSystem.PRIVATE_ARABIC]: 'The user follows the Private Arabic school system: national subjects taught in Arabic medium.',
      [EducationSystem.EXPERIMENTAL]: 'The user follows the Experimental Language system: national subjects with Math/Science taught in English/French.',
      [EducationSystem.AZHAR]: 'The user follows the Azhar system: national subjects plus religious studies.',
      [EducationSystem.INTERNATIONAL]: 'The user follows the International system: completely different curricula with flexible subjects, usually taught in English/French/German medium.',
      [EducationSystem.NATIONAL]: 'The user follows the National system: standard Egyptian curriculum in Arabic.'
    };

    let context = systemDescriptions[user.educationSystem] || '';
    
    // Add grade information if available
    if (user.grade) {
      const gradeDescriptions = {
        // Primary grades
        [Grade.GRADE_1]: 'Grade 1 (Primary)',
        [Grade.GRADE_2]: 'Grade 2 (Primary)',
        [Grade.GRADE_3]: 'Grade 3 (Primary)',
        [Grade.GRADE_4]: 'Grade 4 (Primary)',
        [Grade.GRADE_5]: 'Grade 5 (Primary)',
        [Grade.GRADE_6]: 'Grade 6 (Primary)',
        
        // Preparatory grades
        [Grade.GRADE_7]: 'Grade 7 (Preparatory)',
        [Grade.GRADE_8]: 'Grade 8 (Preparatory)',
        [Grade.GRADE_9]: 'Grade 9 (Preparatory)',
        
        // Secondary grades
        [Grade.GRADE_10]: 'Grade 10 (Secondary)',
        [Grade.GRADE_11]: 'Grade 11 (Secondary)',
        [Grade.GRADE_12]: 'Grade 12 (Secondary)',
        
        // International system
        [Grade.YEAR_7]: 'Year 7 (International)',
        [Grade.YEAR_8]: 'Year 8 (International)',
        [Grade.YEAR_9]: 'Year 9 (International)',
        [Grade.YEAR_10]: 'Year 10 (International)',
        [Grade.YEAR_11]: 'Year 11 (International)',
        [Grade.YEAR_12]: 'Year 12 (International)',
        [Grade.YEAR_13]: 'Year 13 (International)'
      };
      
      const gradeInfo = gradeDescriptions[user.grade];
      if (gradeInfo) {
        context += ` The user is currently in ${gradeInfo}.`;
      }
    }

    // Add subject information if selected
    if (user.subject) {
      const subjectDescriptions: Record<Subject, string> = {
        [Subject.ARABIC]: 'Arabic',
        [Subject.ENGLISH]: 'English',
        [Subject.MATH]: 'Math',
        [Subject.SCIENCE]: 'Science',
        [Subject.RELIGION]: 'Religion',
        [Subject.SOCIAL]: 'Social Studies',
        [Subject.SECOND_LANG]: 'Second Language (e.g., French)',
        [Subject.PHYSICS]: 'Physics',
        [Subject.CHEMISTRY]: 'Chemistry',
        [Subject.BIOLOGY]: 'Biology',
        [Subject.HISTORY]: 'History',
        [Subject.GEOGRAPHY]: 'Geography',
        [Subject.PHILOSOPHY]: 'Philosophy',
        [Subject.MATHS]: 'Maths',
        [Subject.ICT]: 'ICT',
        [Subject.BUSINESS]: 'Business/Economics',
        [Subject.MATH_A]: 'Mathematics (A-Level)',
        [Subject.PHYSICS_A]: 'Physics (A-Level)',
        [Subject.CHEMISTRY_A]: 'Chemistry (A-Level)',
        [Subject.BIOLOGY_A]: 'Biology (A-Level)',
        [Subject.BUSINESS_A]: 'Business/Economics (A-Level)',
        [Subject.QURAN]: 'Quran',
        [Subject.FIQH]: 'Fiqh',
        [Subject.HADITH]: 'Hadith',
      };
      const s = subjectDescriptions[user.subject as Subject];
      if (s) context += ` The selected subject is: ${s}.`;
    }

    return { context, requiresArabic };
  }
}
