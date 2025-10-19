import { Document, Types } from 'mongoose';
export type ChatDocument = Chat & Document;
export type ChatMessageType = 'text' | 'image' | 'pdf' | 'file' | 'system';
export declare class ChatMessage {
    id: string;
    type: ChatMessageType;
    role: 'user' | 'assistant' | 'system';
    content: string;
    meta?: Record<string, any>;
    createdAt: Date;
}
export declare class Chat {
    title: string;
    userId: Types.ObjectId;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt?: Date;
}
export declare const ChatSchema: import("mongoose").Schema<Chat, import("mongoose").Model<Chat, any, any, any, Document<unknown, any, Chat, any, {}> & Chat & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Chat, Document<unknown, {}, import("mongoose").FlatRecord<Chat>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Chat> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
