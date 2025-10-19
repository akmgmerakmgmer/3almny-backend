import { Injectable, Logger } from '@nestjs/common';

/**
 * EducationClassifierService
 * Uses an LLM (OpenAI compatible) to classify whether a text is educational.
 * Falls back to a lightweight keyword heuristic if API key missing or call fails.
 */
@Injectable()
export class EducationClassifierService {
  private readonly logger = new Logger(EducationClassifierService.name);
  private readonly endpoint = process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  /** Simple fallback heuristic (same spirit as original, reduced) */
  private fallback(text: string): boolean {
    const lower = text.toLowerCase();
    const keywords = [
      'explain','define','describe','physics','chemistry','biology','history','algebra','calculus','grammar','theorem','proof','equation','experiment','lesson','topic','chapter','principle','concept','education','learning'
    ];
    return keywords.some(k => lower.includes(k));
  }

  /**
   * Classify text. Returns true if educational, else false.
   */
  async isEducational(text: string): Promise<boolean> {
    if (!text || text.trim().length < 20) return false; // very short => unlikely an article
    if (!this.apiKey) {
      return this.fallback(text);
    }
    const prompt = `You are a classifier. Output ONLY YES or NO.\nText:\n"""${text.slice(0, 4000)}"""\nIs this text educational (teaches or explains academic, scientific, technical, historical, linguistic or learning content)? Answer:`;
    try {
      const res = await fetch(this.endpoint + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You output only YES or NO.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1,
          temperature: 0,
        })
      });
      if (!res.ok) {
        this.logger.warn(`Education classification API failed ${res.status}`);
        return this.fallback(text);
      }
      const json: any = await res.json();
      const answer: string = json?.choices?.[0]?.message?.content?.trim().toUpperCase();
      return answer === 'YES';
    } catch (e) {
      this.logger.warn('Education classification error, using fallback: ' + (e as Error).message);
      return this.fallback(text);
    }
  }
}
