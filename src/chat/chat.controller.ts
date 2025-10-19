import { Body, Controller, Get, Post, Param, Delete, Patch, UseGuards, Req, ForbiddenException, Res, NotFoundException, Query, BadRequestException, Sse, MessageEvent } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { TitleGeneratorService } from './title-generator.service';
import { UsersService } from '../users/users.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PracticeQuestionService } from './practice-question.service';
import { GeneratePracticeQuestionsDto } from './dto/generate-practice-questions.dto';
import { SubmitPracticeQuestionDto } from './dto/submit-practice-question.dto';
import { UpdatePracticeQuestionDto } from './dto/update-practice-question.dto';
import { Observable, from, of } from 'rxjs';
import { catchError, concatWith, mergeMap, map } from 'rxjs/operators';
import { CourseRecommendationService } from './course-recommendation.service';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chats: ChatService, 
    private readonly titleGen: TitleGeneratorService,
    private readonly usersService: UsersService,
    private readonly practiceQuestions: PracticeQuestionService,
    private readonly courseRecommendations: CourseRecommendationService,
  ) { }

  // Returns full list of chats for the user (no pagination)

  private userId(req: Request): string {
    // JwtStrategy.validate returns { userId, email, provider }
    return (req as any).user.userId;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateChatDto) {
    const data = await this.chats.create(this.userId(req), dto);
    return { success: true, data };
  }

  @Get()
  async list(@Req() req: Request, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const lim = parseInt(limit || '20', 10);
    const off = parseInt(offset || '0', 10);
    const page = await this.chats.findAllWithPagination(this.userId(req), lim, off);
    return { success: true, ...page };
  }

  @Get('courses/recommendations')
  async getCourseRecommendations(
    @Req() req: Request,
    @Query('topic') topic?: string,
    @Query('language') language?: string,
    @Query('count') count?: string,
  ) {
    const trimmedTopic = (topic || '').trim().slice(0, 160);
    const normalizedLanguage = language === 'ar' ? 'ar' : language === 'en' ? 'en' : undefined;
    const numericCount = count ? Number(count) : undefined;
    const safeCount = Number.isFinite(numericCount) && numericCount ? Math.round(Number(numericCount)) : undefined;

    const courses = await this.courseRecommendations.recommendCourses(this.userId(req), {
      topic: trimmedTopic,
      language: normalizedLanguage,
      count: safeCount,
    });

    return {
      success: true,
      data: {
        courses,
        language: normalizedLanguage ?? (courses[0]?.language ?? 'en'),
        topic: trimmedTopic,
      },
    };
  }

  @Get('search/messages')
  async searchMessages(
    @Req() req: Request,
    @Query('q') q: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = parseInt(limit || '20', 10);
    const off = parseInt(offset || '0', 10);
    const page = await this.chats.searchMessages(this.userId(req), q, lim, off);
    return { success: true, ...page };
  }

  @Get('user/:userId')
  async listByUser(@Req() req: Request, @Param('userId') userId: string) {
    const current = this.userId(req);
    if (current !== userId) throw new ForbiddenException('Cannot view other user chats');
    const data = await this.chats.findAll(userId);
    return { success: true, data };
  }

  @Get(':id/pdf')
  async exportPdf(@Req() req: Request, @Param('id') id: string, @Query('messageId') messageId: string | undefined, @Res() res: Response) {
    const chat = await this.chats.findOne(this.userId(req), id).catch(() => null);
    if (!chat) throw new NotFoundException('Chat not found');
    const messages: any[] = chat.messages || [];
    let targetAssistant: any | undefined;
    if (messageId) {
      targetAssistant = messages.find(m => m.id === messageId && m.role === 'assistant');
      if (!targetAssistant) {
        throw new NotFoundException('Assistant message not found');
      }
    } else {
      targetAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    }
    // Title based ONLY on assistant message content (single-message context)
    const assistantRaw = (targetAssistant?.content || '').trim();
    let computedFileTitle = deriveContextTitle(assistantRaw) || 'Export';
    try {
      const singleTitle = await this.titleGen.generateForContent(assistantRaw);
      if (singleTitle) computedFileTitle = singleTitle;
    } catch { /* fallback retained */ }
    const fileBase = (computedFileTitle + (messageId ? '-msg-' + messageId.slice(0,6) : '')).replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'export';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileBase}.pdf"`);

    // If no assistant reply yet, return a minimal PDF explaining the situation via HTML
    const raw = (targetAssistant?.content || '').trim();

    // Build outline & sections (reuse previous logic for content organization)
    const outline = buildOutline(raw);
    let computedTitle = computedFileTitle; // preserve title from generator if available
    let sections = { summary: '', examples: [] as string[], details: '' };
    let requiresArabic = false;
    try {
      const userId = this.userId(req);
      const educationContext = await this.usersService.getEducationSystemContext(userId);
      requiresArabic = educationContext.requiresArabic;
      if (raw) {
        sections = await this.titleGen.generateSections(raw, requiresArabic);
      }
    } catch { /* ignore */ }

    const dir = requiresArabic ? 'rtl' : 'ltr';
    const align = requiresArabic ? 'right' : 'left';
    const html = buildHtml({
      title: computedTitle,
      generatedAt: new Date().toLocaleString(),
      dir,
      align,
      outline,
      sections,
      empty: !raw,
    });

    // Render HTML to PDF using Puppeteer (ensures Arabic shaping & RTL)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    let browser: Browser | null = null;
    try {
      console.log('Starting PDF generation for chat:', id);
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=medium'],
        executablePath: executablePath || undefined,
      });
      console.log('Browser launched successfully');
      const page = await browser.newPage();
      // Avoid waiting for external webfonts; we rely on system fonts
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      console.log('HTML content set, generating PDF...');
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' } });
      res.end(pdfBuffer);
    } catch (err) {
      console.error('PDF generation failed:', err);
      // Send proper error response, not JSON after headers might be sent
      if (!res.headersSent) {
        res.status(500).send('PDF generation failed: ' + String(err));
      }
    } finally {
      if (browser) {
        try { await browser.close(); } catch {}
      }
    }
  }

  @Get(':id')
  async get(@Req() req: Request, @Param('id') id: string) {
    const data = await this.chats.findOne(this.userId(req), id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateChatDto) {
    const data = await this.chats.update(this.userId(req), id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    const data = await this.chats.remove(this.userId(req), id);
    return { success: true, data };
  }

  @Post(':id/messages')
  async addMessage(@Req() req: Request, @Param('id') id: string, @Body() dto: CreateMessageDto) {
    const data = await this.chats.addMessage(this.userId(req), id, dto);
    return { success: true, data };
  }

  @Delete(':id/messages/:messageId')
  async removeMessage(@Req() req: Request, @Param('id') id: string, @Param('messageId') messageId: string) {
    const data = await this.chats.removeMessage(this.userId(req), id, messageId);
    return { success: true, data };
  }

  @Get(':id/messages/with-context')
  async getMessagesWithEducationContext(@Req() req: Request, @Param('id') id: string) {
    const data = await this.chats.getMessagesWithEducationContext(this.userId(req), id);
    return { success: true, data };
  }

  @Sse(':id/messages/:messageId/practice-questions/stream')
  streamPracticeQuestions(
    @Req() req: Request,
    @Param('id') chatId: string,
    @Param('messageId') messageId: string,
    @Query('difficulty') difficulty?: string,
    @Query('count') count?: string,
    @Query('language') language?: string,
  ): Observable<MessageEvent> {
    const options: GeneratePracticeQuestionsDto = {} as any;
    if (difficulty && ['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
      options.difficulty = difficulty as any;
    }
    if (count && !Number.isNaN(Number(count))) {
      options.count = Number(count);
    }
    if (language && ['auto', 'en', 'ar'].includes(language)) {
      options.language = language as any;
    }
    const userId = this.userId(req);
    return from(
      this.practiceQuestions.generateForMessage(userId, chatId, messageId, options),
    ).pipe(
      mergeMap((items) => {
        const total = items.length;
        if (!total) {
          return of({ data: { type: 'done', total } } as MessageEvent);
        }
        return from(items).pipe(
          map((question, index) => ({
            data: { type: 'question', index, total, question },
          }) as MessageEvent),
          concatWith(of({ data: { type: 'done', total } } as MessageEvent)),
        );
      }),
      catchError((error: any) => {
        const message = error?.message || 'Failed to generate practice questions';
        if (error instanceof BadRequestException || error instanceof ForbiddenException || error instanceof NotFoundException) {
          return of({ data: { type: 'error', message } } as MessageEvent);
        }
        return of({ data: { type: 'error', message } } as MessageEvent);
      }),
    );
  }

  @Post(':id/messages/:messageId/practice-questions')
  async generatePracticeQuestions(
    @Req() req: Request,
    @Param('id') chatId: string,
    @Param('messageId') messageId: string,
    @Body() dto: GeneratePracticeQuestionsDto,
  ) {
    const data = await this.practiceQuestions.generateForMessage(this.userId(req), chatId, messageId, dto);
    return { success: true, data };
  }

  @Get(':id/messages/:messageId/practice-questions')
  async getPracticeQuestions(
    @Req() req: Request,
    @Param('id') chatId: string,
    @Param('messageId') messageId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const include = includeArchived === 'true';
    const data = await this.practiceQuestions.getQuestionsForMessage(this.userId(req), chatId, messageId, include);
    return { success: true, data };
  }

  @Post('questions/:questionId/submit')
  async submitPracticeQuestion(
    @Req() req: Request,
    @Param('questionId') questionId: string,
    @Body() dto: SubmitPracticeQuestionDto,
  ): Promise<{ success: true; data: any }> {
    const data = await this.practiceQuestions.submitAnswer(this.userId(req), questionId, {
      answer: dto.answer,
      selectedOptionIndex: dto.selectedOptionIndex,
    });
    return { success: true, data };
  }

  @Patch('questions/:questionId/archive')
  async updatePracticeQuestion(
    @Req() req: Request,
    @Param('questionId') questionId: string,
    @Body() dto: UpdatePracticeQuestionDto,
  ) {
    const data = await this.practiceQuestions.archiveQuestion(this.userId(req), questionId, dto.archived !== false);
    return { success: true, data };
  }

  @Get('practice/statistics')
  async getPracticeStatistics(@Req() req: Request) {
    const data = await this.practiceQuestions.getUserStatistics(this.userId(req));
    return { success: true, data };
  }
}

// ---- Outline & PDF helpers (could be refactored to service) ----
interface Outline { title: string; points: string[]; remaining: string; }

function buildOutline(content: string): Outline {
  const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean);
  let title = lines[0] || 'Article';
  title = title.replace(/^[#>*\d\-\s]+/, '').slice(0, 100).replace(/[.!?]$/,'');
  const bulletRegex = /^(?:[-*•]|\d+\.)\s+/;
  const points: string[] = [];
  const bodyLines: string[] = [];
  for (const ln of lines) {
    if (bulletRegex.test(ln) && points.length < 12) {
      points.push(ln.replace(bulletRegex, '').trim());
    } else {
      bodyLines.push(ln);
    }
  }
  if (points.length < 3) {
    const sentences = content.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 30).slice(0, 10);
    while (points.length < 5 && sentences.length) {
      const s = sentences.shift();
      if (s) points.push(s);
    }
  }
  return { title, points, remaining: bodyLines.join('\n') };
}

// Build HTML string for PDF (uses Google Fonts Noto Naskh Arabic for proper Arabic shaping)
function buildHtml({ title, generatedAt, dir, align, outline, sections, empty }: { title: string; generatedAt: string; dir: 'rtl' | 'ltr'; align: 'right' | 'left'; outline: Outline; sections: { summary: string; examples: string[]; details: string }; empty: boolean; }): string {
  const style = `
    <style>
      :root { --fg:#111; --muted:#666; --brand:#e11d48; }
      * { box-sizing: border-box; }
      html, body { margin:0; padding:0; }
      body { font-family: 'Segoe UI', 'Noto Naskh Arabic', Tahoma, Arial, Helvetica, sans-serif; color:var(--fg); direction:${dir}; }
      .container { padding: 12mm 10mm; }
      h1 { margin:0 0 6mm; font-size: 20pt; font-weight: 700; }
      .meta { color: var(--muted); font-size: 9pt; margin-bottom: 8mm; text-align:${align}; }
      .section-title { color: var(--brand); font-weight: 700; font-size: 12pt; margin: 8mm 0 3mm; text-transform: uppercase; letter-spacing: .3px; text-align:${align}; }
      ul { margin:0; padding-${dir === 'rtl' ? 'right' : 'left'}: 5mm; }
      li { margin: 2.5mm 0; line-height: 1.45; }
      p { margin: 3mm 0; line-height: 1.6; text-align:${align}; font-size: 11pt; }
      .footer { margin-top: 10mm; color: #888; font-size: 8.5pt; text-align:${align}; }
      .empty { color:#b91c1c; font-size:12pt; font-weight:600; }
    </style>
  `;
  const pointsHtml = outline.points.map(p => `<li>${escapeHtml(p)}</li>`).join('');
  const detailsParas = sections.details
    ? sections.details.split(/\n{2,}/).map(p => `<p>${escapeHtml(p.trim())}</p>`).join('')
    : '';
  const examplesHtml = sections.examples && sections.examples.length
    ? `<div class="section-title">${dir === 'rtl' ? 'أمثلة من الواقع' : 'Real Life Examples'}</div><ul>${sections.examples.map((e: string) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`
    : '';
  const summaryHtml = sections.summary
    ? `<div class="section-title">${dir === 'rtl' ? 'ملخص' : 'Summary'}</div><p>${escapeHtml(sections.summary)}</p>`
    : '';

  return `<!DOCTYPE html>
  <html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${style}
      <title>${escapeHtml(title)}</title>
    </head>
    <body>
      <div class="container">
        <h1 style="text-align:${align}">${escapeHtml(title)}</h1>
        <div class="meta">${escapeHtml((dir === 'rtl' ? 'تم الإنشاء: ' : 'Generated: ') + generatedAt)}</div>
        ${empty ? `<p class="empty">${dir === 'rtl' ? 'لا يوجد رد من المساعد مناسب للتصدير.' : 'No assistant response available for export.'}</p>` : `
          <div class="section-title">${dir === 'rtl' ? 'أهم النقاط' : 'Key Points'}</div>
          <ul>${pointsHtml}</ul>
          ${summaryHtml}
          ${sections.details ? `<div class="section-title">${dir === 'rtl' ? 'التفاصيل' : 'Details'}</div>` : ''}
          ${detailsParas}
          ${examplesHtml}
          <div class="footer">${dir === 'rtl' ? 'تمت هيكلة المحتوى تلقائيًا من آخر رد للمساعد.' : 'Structured automatically from the last assistant response.'}</div>
        `}
      </div>
    </body>
  </html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Heuristic context-based title extraction from assistant content
function deriveContextTitle(content: string): string | null {
  if (!content) return null;
  // Prefer first markdown style heading if present
  const headingMatch = content.match(/^\s{0,3}#{1,3}\s+(.{3,80})$/m);
  if (headingMatch) return cleanTitleFragment(headingMatch[1]);
  // Otherwise first non-empty line
  const firstLine = content.split(/\n+/).map(l => l.trim()).find(l => l.length > 8) || '';
  if (firstLine) return cleanTitleFragment(firstLine.slice(0, 80));
  return null;
}

function cleanTitleFragment(t: string): string {
  return t.replace(/[`*_#>\-]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '');
}
