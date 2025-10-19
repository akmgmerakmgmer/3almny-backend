import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ _id: false, timestamps: false })
export class BookmarkEntry {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  id!: string;

  @Prop({ type: String, default: null })
  chatId?: string | null;

  @Prop({ required: true })
  messageId!: string;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;

  @Prop({ type: Date, default: () => new Date() })
  savedAt!: Date;
}

export const BookmarkEntrySchema = SchemaFactory.createForClass(BookmarkEntry);

@Schema({ _id: false, timestamps: false })
export class StudyRecordEntry {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  id!: string;

  @Prop({ type: Date, required: true })
  startedAt!: Date;

  @Prop({ type: Date, required: true })
  endedAt!: Date;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  subject!: string;

  @Prop({ type: Number, required: true, min: 0 })
  timeSpentMinutes!: number;
}

export const StudyRecordEntrySchema = SchemaFactory.createForClass(StudyRecordEntry);

export enum EducationSystem {
  PRIVATE_ARABIC = 'private_arabic',
  EXPERIMENTAL = 'experimental',
  AZHAR = 'azhar',
  INTERNATIONAL = 'international',
  NATIONAL = 'national'
}

export enum Grade {
  // Primary Education (6 years)
  GRADE_1 = 'grade_1',
  GRADE_2 = 'grade_2',
  GRADE_3 = 'grade_3',
  GRADE_4 = 'grade_4',
  GRADE_5 = 'grade_5',
  GRADE_6 = 'grade_6',
  
  // Preparatory Education (3 years)
  GRADE_7 = 'grade_7',
  GRADE_8 = 'grade_8',
  GRADE_9 = 'grade_9',
  
  // Secondary Education (3 years)
  GRADE_10 = 'grade_10',
  GRADE_11 = 'grade_11',
  GRADE_12 = 'grade_12',
  
  // International System specific
  YEAR_7 = 'year_7',
  YEAR_8 = 'year_8',
  YEAR_9 = 'year_9',
  YEAR_10 = 'year_10',
  YEAR_11 = 'year_11',
  YEAR_12 = 'year_12',
  YEAR_13 = 'year_13'
}

export enum Subject {
  ARABIC = 'arabic',
  ENGLISH = 'english',
  MATH = 'math',
  SCIENCE = 'science',
  RELIGION = 'religion',
  SOCIAL = 'social',
  SECOND_LANG = 'second_lang',
  PHYSICS = 'physics',
  CHEMISTRY = 'chemistry',
  BIOLOGY = 'biology',
  HISTORY = 'history',
  GEOGRAPHY = 'geography',
  PHILOSOPHY = 'philosophy',
  MATHS = 'maths',
  ICT = 'ict',
  BUSINESS = 'business',
  MATH_A = 'math_a',
  PHYSICS_A = 'physics_a',
  CHEMISTRY_A = 'chemistry_a',
  BIOLOGY_A = 'biology_a',
  BUSINESS_A = 'business_a',
  QURAN = 'quran',
  FIQH = 'fiqh',
  HADITH = 'hadith'
}

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class User {
  @Prop({ required: true })
  username!: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email!: string;

  @Prop({ default: '', select: false })
  passwordHash!: string;

  @Prop({ required: true, enum: ['local', 'google'] })
  provider!: 'local' | 'google';

  @Prop({ index: true })
  googleId?: string;

  @Prop({ 
    type: String, 
    enum: Object.values(EducationSystem),
    default: null
  })
  educationSystem?: EducationSystem | null;

  @Prop({ 
    type: String, 
    enum: Object.values(Grade),
    default: null
  })
  grade?: Grade | null;

  @Prop({
    type: String,
    enum: Object.values(Subject),
    default: null
  })
  subject?: Subject | null;

  @Prop({ type: [BookmarkEntrySchema], default: [] })
  bookmarks!: BookmarkEntry[];

  @Prop({ type: [StudyRecordEntrySchema], default: [] })
  records!: StudyRecordEntry[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure toJSON/toObject include virtual id
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
});

UserSchema.set('toObject', { virtuals: true });
