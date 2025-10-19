export declare class CreateMessageDto {
    type: 'text' | 'image' | 'pdf' | 'file' | 'system';
    content: string;
    role?: 'user' | 'assistant' | 'system';
    meta?: Record<string, any>;
}
