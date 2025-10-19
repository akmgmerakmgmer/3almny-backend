import { UsersService } from '../users/users.service';
export interface CourseRecommendation {
    title: string;
    platform: string;
    url: string;
    description: string;
    language: 'en' | 'ar';
}
interface RecommendCoursesOptions {
    topic?: string;
    language?: 'en' | 'ar';
    count?: number;
}
export declare class CourseRecommendationService {
    private readonly users;
    private readonly logger;
    private readonly endpoint;
    private readonly apiKey;
    constructor(users: UsersService);
    recommendCourses(userId: string, options?: RecommendCoursesOptions): Promise<CourseRecommendation[]>;
    private normalizeCourse;
    private buildPrompt;
    private fallbackRecommendations;
}
export {};
