import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TitleGeneratorService {
  private readonly logger = new Logger(TitleGeneratorService.name);
  private readonly endpoint = process.env.OPENAI_BASE_URL?.replace(/\/$/, '') || 'https://api.openai.com/v1';
  private readonly apiKey = process.env.OPENAI_API_KEY;

  async generate(messages: { role: string; content: string }[]): Promise<string | null> {
    // Use last up to 6 messages as context
    const recent = messages.slice(-6);
    const joined = recent.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    if (!this.apiKey) {
      // Fallback: derive from first substantive user line
      const firstUser = [...messages].find(m => m.role === 'user' && m.content.trim().length > 12);
      return firstUser ? truncateTitle(firstUser.content) : null;
    }
    const prompt = `Create a very short (max 6 words) neutral, title-cased chat title summarizing the main topic. No quotes, no punctuation at end. If the content is generic greetings only respond with: New Chat.\n\nContext:\n${joined}\n\nTitle:`;
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
            { role: 'system', content: 'You output only the title text.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 12,
          temperature: 0.3,
        })
      });
      if (!res.ok) {
        this.logger.warn('Title generation failed: ' + res.status);
        return null;
      }
      const json: any = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content?.trim() || '';
      return sanitize(raw) || null;
    } catch (e) {
      this.logger.warn('Title generation error: ' + (e as Error).message);
      return null;
    }
  }

  /** Generate a concise (<=8 words) title purely from one assistant message's content (no chat title influence). */
  async generateForContent(content: string): Promise<string | null> {
    const text = (content || '').trim();
    if (!text) return null;
    // If no API key, fallback heuristic: first meaningful line truncated
    if (!this.apiKey) {
      const line = text.split(/\n+/).map(l => l.trim()).find(l => l.length > 12) || text.slice(0, 80);
      return clampTitle(truncateTitle(line));
    }
    const prompt = `Create a VERY SHORT (max 4 words) descriptive, title-cased document title summarizing ONLY the content below. Absolutely no quotes, no trailing punctuation, no emojis. If content is greetings / too vague output: General Summary. Output ONLY the title text.\n\nContent:\n"""\n${text.slice(0, 6000)}\n"""\nTitle:`;
    try {
      const res = await fetch(this.endpoint + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You output only the title text.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 12,
          temperature: 0.3,
        })
      });
      if (!res.ok) return truncateTitle(text);
      const json: any = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content?.trim() || '';
      const cleaned = clampTitle(sanitize(raw) || truncateTitle(text));
      return cleaned;
    } catch {
      return clampTitle(truncateTitle(text));
    }
  }

  /**
   * Generates a concise summary (<= ~120 words) and up to 3 real life examples from raw assistant content.
   * If no API key, uses heuristic fallbacks.
   */
  async generateSections(rawContent: string, forceArabic: boolean = false): Promise<{ summary: string; examples: string[]; details: string }> {
    const content = (rawContent || '').trim();
    if (!content) {
      return { summary: 'No content available to summarize.', examples: [], details: 'No content available for detailed explanation.' };
    }
    if (!this.apiKey) {
      // When no API key available, return the original content as-is with fallback messages
      const exampleCandidates = content.split(/(?<=[.!?])\s+/).filter(s => /\b(example|e\.g\.|for instance|for example)\b/i.test(s)).slice(0, 3);
      return { 
        summary: 'LLM summary generation unavailable - API key not configured.', 
        examples: exampleCandidates.length > 0 ? exampleCandidates : ['No examples available without LLM processing.'], 
        details: content // Display original content as-is for details
      };
    }
    const languageInstruction = forceArabic 
      ? '\n\nIMPORTANT: You must respond in Arabic language only. All JSON field values (summary, examples, details) must be written completely in Arabic.'
      : '';

    const prompt = `You will receive raw assistant output content.\nProduce a JSON object with three fields:\n1. summary: A comprehensive summary that captures ALL key points from the article/response without leaving any important information behind. Include all main concepts, conclusions, and essential details. Make it as detailed as needed to cover everything important.\n2. examples: An array of up to 3 concrete real-life examples that illustrate the concepts discussed in the content.\n3. details: A detailed explanation of the article/response content with comprehensive explanations and examples. Expand on the concepts, provide in-depth analysis, and include practical applications. Make it as thorough and detailed as necessary.${languageInstruction}\n\nReturn ONLY valid JSON.\n\nContent:\n"""\n${content.slice(0, 8000)}\n"""\n`;
    try {
      const res = await fetch(this.endpoint + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: forceArabic ? 'You output ONLY minified JSON like {"summary":"...","examples":["..."],"details":"..."}. Write all content in Arabic language.' : 'You output ONLY minified JSON like {"summary":"...","examples":["..."],"details":"..."}.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.4,
        })
      });
      if (!res.ok) {
        this.logger.warn('Section generation failed: ' + res.status);
        return { summary: 'Summary unavailable (generation failed).', examples: [], details: 'Details unavailable (generation failed).' };
      }
      const json: any = await res.json();
      const raw: string = json?.choices?.[0]?.message?.content?.trim() || '{}';
      let parsed: any = {};
      try { parsed = JSON.parse(raw); } catch { parsed = {}; }

      const summary: string = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : 'Summary unavailable.';
      const details: string = typeof parsed.details === 'string' && parsed.details.trim() ? parsed.details.trim() : 'Details unavailable.';
      let examples: string[] = Array.isArray(parsed.examples) ? parsed.examples.filter((e: any) => typeof e === 'string' && e.trim()).slice(0, 3) : [];
      // If no examples, attempt a second LLM pass to synthesize examples (still JSON-only)
      if (!examples.length) {
        try {
          const exLanguageInstruction = forceArabic ? ' You must write all examples in Arabic language only.' : '';
          const exPrompt = `From the content below extract or, ONLY IF none truly exist, synthesize up to 3 realistic, concise real-life examples illustrating the key ideas. Return JSON {"examples":["..."]}. Avoid fabricating impossible facts. If you must synthesize, keep them generic and plausible.${exLanguageInstruction} Content:\n"""\n${content.slice(0,4000)}\n"""`;
          const exRes = await fetch(this.endpoint + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
              messages: [
                { role: 'system', content: forceArabic ? 'You output ONLY minified JSON like {"examples":["..."]}. Write all content in Arabic.' : 'You output ONLY minified JSON like {"examples":["..."]}.' },
                { role: 'user', content: exPrompt }
              ],
              temperature: 0.5,
            })
          });
          if (exRes.ok) {
            const exJson: any = await exRes.json();
            const exRaw: string = exJson?.choices?.[0]?.message?.content?.trim() || '{}';
            let exParsed: any = {};
            try { exParsed = JSON.parse(exRaw); } catch { exParsed = {}; }
            if (Array.isArray(exParsed.examples)) {
              examples = exParsed.examples.filter((e: any) => typeof e === 'string' && e.trim()).slice(0,3);
            }
          }
        } catch { /* ignore secondary failure */ }
      }
      // Heuristic fallback if still empty
      if (!examples.length) {
        const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        const candidate = sentences.filter(s => /\b(for example|for instance|e\.g\.|example of|such as)\b/i.test(s)).slice(0,3);
        examples = candidate;
      }
      return { summary, examples, details };
    } catch (e) {
      this.logger.warn('Section generation error: ' + (e as Error).message);
      return { summary: 'Summary unavailable (error).', examples: [], details: 'Details unavailable (error).' };
    }
  }
}

function sanitize(title: string): string {
  let t = title.replace(/^['"\-\s]+|['"\s]+$/g, '');
  t = t.replace(/\.$/, '');
  if (/^new chat$/i.test(t)) return 'New Chat';
  // Limit length
  return toTitleCase(t);
}

function toTitleCase(str: string): string {
  return str.replace(/\w[\w']*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function truncateTitle(text: string): string {
  const firstLine = text.split(/\n/)[0];
  const trimmed = firstLine.trim();
  return toTitleCase(trimmed || 'New Chat');
}

function clampTitle(t: string): string {
  const words = t.split(/\s+/).filter(Boolean);
  let joined = words.join(' ');
  return joined;
}
