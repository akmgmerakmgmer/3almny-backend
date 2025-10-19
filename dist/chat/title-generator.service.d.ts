export declare class TitleGeneratorService {
    private readonly logger;
    private readonly endpoint;
    private readonly apiKey;
    generate(messages: {
        role: string;
        content: string;
    }[]): Promise<string | null>;
    generateForContent(content: string): Promise<string | null>;
    generateSections(rawContent: string, forceArabic?: boolean): Promise<{
        summary: string;
        examples: string[];
        details: string;
    }>;
}
