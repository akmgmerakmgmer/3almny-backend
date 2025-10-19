export declare class EducationClassifierService {
    private readonly logger;
    private readonly endpoint;
    private readonly apiKey;
    private fallback;
    isEducational(text: string): Promise<boolean>;
}
