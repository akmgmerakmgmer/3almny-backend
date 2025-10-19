import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = Chat & Document;

export type ChatMessageType = 'text' | 'image' | 'pdf' | 'file' | 'system';

@Schema({ _id: false, timestamps: false })
export class ChatMessage {
  @Prop({ type: String, default: () => new Types.ObjectId().toString() })
  id!: string;

  @Prop({ required: true, enum: ['text', 'image', 'pdf', 'file', 'system'] })
  type!: ChatMessageType;

  @Prop({ required: true, enum: ['user', 'assistant', 'system'], default: 'user' })
  role!: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content!: string; // Could store URL (for image/pdf) or text payload

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>; // Optional extra metadata (e.g., size, mime)

  @Prop({ required: true, default: () => new Date() })
  createdAt!: Date;
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Chat {
  @Prop({ required: true })
  title!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages!: ChatMessage[];

  @Prop()
  createdAt!: Date;

  @Prop()
  updatedAt?: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

ChatSchema.set('toObject', { virtuals: true });
