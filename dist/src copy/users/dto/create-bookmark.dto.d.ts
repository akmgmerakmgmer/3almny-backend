export declare const BOOKMARK_ROLES: readonly ["user", "assistant", "system"];
export type BookmarkRole = typeof BOOKMARK_ROLES[number];
export declare class CreateBookmarkDto {
    chatId?: string | null;
    messageId: string;
    role: BookmarkRole;
    content: string;
    meta?: Record<string, any>;
}
