import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class CourseRecommendationService {
  private readonly logger = new Logger(CourseRecommendationService.name);
  private readonly endpoint = process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  constructor(private readonly users: UsersService) {}

  async recommendCourses(userId: string, options: RecommendCoursesOptions = {}): Promise<CourseRecommendation[]> {
    const { topic = '', language, count } = options;
    const preferredCount = Math.min(Math.max(count ?? 3, 2), 3);

    const educationContext = await this.users.getEducationSystemContext(userId).catch((error) => {
      this.logger.debug(`Failed to resolve education context: ${error instanceof Error ? error.message : error}`);
      return { context: null, requiresArabic: false };
    });

    const targetLanguage: 'en' | 'ar' = language ?? (educationContext.requiresArabic ? 'ar' : 'en');

    if (!this.apiKey) {
      return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
    }

    const instructions = this.buildPrompt({
      targetLanguage,
      topic,
      count: preferredCount,
      educationContext: educationContext.context ?? undefined,
    });

    try {
      const response = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.3,
          messages: [
            {
              role: 'system',
              content: targetLanguage === 'ar'
                ? 'أنت مساعد تعليمي يقترح الدورات. يجب أن تعود باستجابة JSON فقط بصيغة {"courses":[{"title":"...","platform":"YouTube","url":"https://...","description":"...","language":"ar"}]} بدون أي نص إضافي.'
                : 'You are an educational assistant. Respond ONLY with valid minified JSON like {"courses":[{"title":"...","platform":"YouTube","url":"https://...","description":"...","language":"en"}]} and no other text.',
            },
            {
              role: 'user',
              content: instructions,
            },
          ],
          max_tokens: 900,
        }),
      });

      if (!response.ok) {
        this.logger.warn(`Course recommendation request failed with status ${response.status}`);
        return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
      }

      const json: any = await response.json();
      const content = json?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        this.logger.warn('Course recommendation response missing content');
        return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
      }

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch (error) {
        this.logger.warn(`Failed to parse course recommendation JSON: ${error instanceof Error ? error.message : error}`);
        return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
      }

      const courses: unknown[] = Array.isArray(parsed?.courses) ? parsed.courses : [];
      const sanitized = courses
        .filter((course: unknown): course is Record<string, unknown> => Boolean(course) && typeof course === 'object')
  .map((course: Record<string, unknown>) => this.normalizeCourse(course, targetLanguage))
        .filter((course): course is CourseRecommendation => Boolean(course));

      if (!sanitized.length) {
        return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
      }

      return sanitized.slice(0, preferredCount);
    } catch (error) {
      this.logger.warn(`Course recommendation error: ${error instanceof Error ? error.message : error}`);
      return this.fallbackRecommendations(targetLanguage, topic, preferredCount);
    }
  }

  private normalizeCourse(raw: any, language: 'en' | 'ar'): CourseRecommendation | null {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    const platform = typeof raw.platform === 'string' ? raw.platform.trim() : '';
    const url = typeof raw.url === 'string' ? raw.url.trim() : '';
    const description = typeof raw.description === 'string' ? raw.description.trim() : '';

    if (!title || !url) {
      return null;
    }

    const normalizedPlatform = platform || (url.includes('youtube') ? 'YouTube' : url.includes('udemy') ? 'Udemy' : 'Course');
    const secureUrl = url.startsWith('http://') ? url.replace(/^http:\/\//i, 'https://') : url;

    return {
      title,
      platform: normalizedPlatform,
      url: secureUrl,
      description: description || (language === 'ar' ? 'دورة تعليمية موصى بها.' : 'Recommended learning resource.'),
      language,
    };
  }

  private buildPrompt(params: { targetLanguage: 'en' | 'ar'; topic?: string; count: number; educationContext?: string }): string {
    const { targetLanguage, topic, count, educationContext } = params;
    const topicLine = topic ? (targetLanguage === 'ar' ? `الموضوع المطلوب: ${topic}.` : `Focus topic: ${topic}.`) : '';
    const contextLine = educationContext ? (targetLanguage === 'ar'
      ? `سياق المستخدم التعليمي: ${educationContext}`
      : `Learner context: ${educationContext}`) : '';
    const intro = targetLanguage === 'ar'
      ? 'اقترح دورات تعليمية بالفيديو تناسب طالباً في المدرسة. يجب أن تكون الدورات من YouTube أو Udemy فقط.'
      : 'Recommend video-based learning courses suitable for a K-12 learner. Courses must come from YouTube or Udemy only.';
    const countInstruction = targetLanguage === 'ar'
      ? `أعد بالضبط ${count} دورات بحد أقصى.`
      : `Return exactly ${count} courses at most.`;
    const languageInstruction = targetLanguage === 'ar'
      ? 'اكتب جميع الحقول باللغة العربية بما في ذلك الوصف.'
      : 'Write all fields in English, including descriptions.';
    const structureInstruction = targetLanguage === 'ar'
      ? 'تأكد أن كل عنصر يحتوي الحقول: title, platform (YouTube أو Udemy فقط), url, description, language.'
      : 'Ensure each item includes: title, platform (either YouTube or Udemy), url, description, language.';

    return [intro, topicLine, contextLine, countInstruction, languageInstruction, structureInstruction, 'أعد النتيجة بصيغة JSON فقط بدون أي نص خارجي.', 'Return the JSON only.'].join('\n');
  }

  private fallbackRecommendations(language: 'en' | 'ar', topic: string, count: number): CourseRecommendation[] {
    const defaultsEn: CourseRecommendation[] = [
      {
        title: 'Fundamentals of Math - Khan Academy Playlist',
        platform: 'YouTube',
        url: 'https://www.youtube.com/playlist?list=PLSQl0a2vh4HD7aldRn0l-a0Pb4C8R5t1X',
        description: 'Structured lessons covering middle school math fundamentals with practice problems.',
        language: 'en',
      },
      {
        title: 'Science Basics for Middle School',
        platform: 'YouTube',
        url: 'https://www.youtube.com/playlist?list=PLkh9EPEB0v5i2NOV-5-Zh6w5WAXj8Tz1a',
        description: 'Short concept videos that explain physics, chemistry, and biology topics for beginners.',
        language: 'en',
      },
      {
        title: 'Udemy: Complete English Grammar Course',
        platform: 'Udemy',
        url: 'https://www.udemy.com/course/complete-english-grammar-course/',
        description: 'Comprehensive English grammar lessons with downloadable worksheets and exercises.',
        language: 'en',
      },
    ];

    const defaultsAr: CourseRecommendation[] = [
      {
        title: 'دورة الرياضيات المتكاملة للمرحلة الإعدادية',
        platform: 'YouTube',
        url: 'https://www.youtube.com/playlist?list=PL2PzW-rJj9HJMx1x64tZQDJd8ydmmio9c',
        description: 'شرح مبسط ومفصل لدروس الرياضيات الأساسية باللغة العربية مع أمثلة محلولة.',
        language: 'ar',
      },
      {
        title: 'أساسيات العلوم باللغة العربية',
        platform: 'YouTube',
        url: 'https://www.youtube.com/playlist?list=PL3aNtjfbZ8dRzCQXDpUe1koRaSP-L6e7y',
        description: 'فيديوهات قصيرة تشرح مفاهيم الفيزياء والكيمياء والأحياء بطريقة مبسطة.',
        language: 'ar',
      },
      {
        title: 'Udemy: دورة اللغة الإنجليزية من الصفر',
        platform: 'Udemy',
        url: 'https://www.udemy.com/course/english-grammar-arabic/',
        description: 'شرح قواعد اللغة الإنجليزية للمبتدئين باللغة العربية مع أمثلة وتمارين.',
        language: 'ar',
      },
    ];

    const pool = language === 'ar' ? defaultsAr : defaultsEn;

    if (topic) {
      const filtered = pool.filter((course) => course.title.toLowerCase().includes(topic.toLowerCase()));
      if (filtered.length >= 2) {
        return filtered.slice(0, count);
      }
    }

    return pool.slice(0, count);
  }
}
