import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { Chat } from './chat.schema';

export type PracticeQuestionDocument = PracticeQuestion & Document;

export type PracticeQuestionType = 'multiple-choice' | 'true-false';
export type PracticeDifficulty = 'easy' | 'medium' | 'hard';

@Schema({ timestamps: true })
export class PracticeQuestion {
  @Prop({ type: SchemaTypes.ObjectId, ref: Chat.name, index: true, required: true })
  chatId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  messageId!: string;

  @Prop({ type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' })
  difficulty!: PracticeDifficulty;

  @Prop({
    type: String,
    enum: ['multiple-choice', 'true-false'],
    default: 'multiple-choice',
  })
  type!: PracticeQuestionType;

  @Prop({ type: String, required: true })
  question!: string;

  @Prop({
    type: [{ label: String, value: String }],
    default: undefined,
  })
  options?: { label: string; value: string }[];

  @Prop({ type: Number, min: 0 })
  correctOption?: number;

  @Prop({ type: [String], default: [] })
  acceptableAnswers!: string[];

  @Prop({ type: String })
  explanation?: string;

  @Prop({ type: Boolean, default: true })
  autoGraded!: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  archived!: boolean;

  @Prop({ type: Number, default: 0 })
  attempts!: number;

  @Prop({ type: Number, default: 0 })
  correctAttempts!: number;

  @Prop({ type: String, enum: ['en', 'ar'], default: 'en' })
  language!: 'en' | 'ar';

  @Prop({ type: String, default: null })
  sourceSummary?: string | null;

  @Prop({ type: String, default: null })
  sourceTitle?: string | null;
}

export const PracticeQuestionSchema = SchemaFactory.createForClass(PracticeQuestion);

PracticeQuestionSchema.index({ chatId: 1, messageId: 1, archived: 1 });
PracticeQuestionSchema.index({ userId: 1, archived: 1 });
