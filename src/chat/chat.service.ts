import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Chat, ChatDocument } from './chat.schema';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { EducationClassifierService } from './education-classifier.service';
import { TitleGeneratorService } from './title-generator.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private readonly chatModel: Model<ChatDocument>,
    private readonly educationClassifier: EducationClassifierService,
    private readonly titleGenerator: TitleGeneratorService,
    private readonly usersService: UsersService,
  ) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private ensureOwner(chat: ChatDocument, userId: string) {
    if (chat.userId.toString() !== userId) {
      throw new ForbiddenException('You do not own this chat');
    }
  }

  async create(userId: string, dto: CreateChatDto) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException('Invalid user context for chat creation');
    }
    const chat = await this.chatModel.create({
      title: 'New Chat',
      userId: new Types.ObjectId(userId),
      messages: (dto.messages || []).map((m: any) => ({ ...m, createdAt: new Date() })),
    });
    return chat.toJSON();
  }

  async findAll(userId: string) {
    const chats = await this.chatModel.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).lean();
    return chats.map(c => ({ ...c, id: c._id, _id: undefined }));
  }

  async findAllWithPagination(userId: string, limit = 20, offset = 0) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);
    const query = { userId: new Types.ObjectId(userId) } as any;
    const [items, total] = await Promise.all([
      this.chatModel.find(query).sort({ updatedAt: -1 }).skip(safeOffset).limit(safeLimit).lean(),
      this.chatModel.countDocuments(query)
    ]);
    const data = items.map(c => ({ ...c, id: c._id, _id: undefined }));
    return { data, total, limit: safeLimit, offset: safeOffset, nextOffset: safeOffset + data.length < total ? safeOffset + data.length : null };
  }

  async findOne(userId: string, id: string) {
    const chat = await this.chatModel.findById(id);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    return chat.toJSON();
  }

  async update(userId: string, id: string, dto: UpdateChatDto) {
    const chat = await this.chatModel.findById(id);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    if (dto.title !== undefined) chat.title = dto.title;
    await chat.save();
    return chat.toJSON();
  }

  async remove(userId: string, id: string) {
    const chat = await this.chatModel.findById(id);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    await chat.deleteOne();
    return { deleted: true };
  }

  async addMessage(userId: string, chatId: string, dto: CreateMessageDto) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    let meta = (dto as any).meta || {};
    const role = (dto.role || 'user') as 'user' | 'assistant' | 'system';
    
    // Add education system context for user messages
    if (role === 'user') {
      const educationContext = await this.usersService.getEducationSystemContext(userId);
      if (educationContext) {
        meta.educationSystemContext = educationContext;
      }
    }
    
    // Educational classification delegated to LLM classifier + structural check
    if (role === 'assistant' && dto.content) {
      const content = dto.content;
      const wordCount = content.trim().split(/\s+/).length;
      const paragraphCount = content.split(/\n{2,}/).filter(p => p.trim().length > 0).length;
      const hasHeadings = /(^|\n)#+\s|(^|\n)(?:\d+\.|[-*])\s/.test(content);
      const substantive = wordCount >= 120 || paragraphCount >= 3 || hasHeadings;
      if (substantive) {
        try {
          const educational = await this.educationClassifier.isEducational(content);
          meta.articleEligible = educational && substantive;
        } catch (e) {
          // On classification failure, default to false (conservative)
          meta.articleEligible = false;
        }
      } else {
        meta.articleEligible = false;
      }
    }
    const message = { ...dto, role, meta, id: new Types.ObjectId().toString(), createdAt: new Date() } as any;
    chat.messages.push(message);
    await chat.save();

    // After first substantive assistant reply, attempt automatic title generation if still 'New Chat'
    if (role === 'assistant' && chat.title === 'New Chat') {
      const assistantText = dto.content?.trim() || '';
      const userContext = chat.messages.filter(m => (m as any).role === 'user').slice(-3).map(m => ({ role: 'user', content: (m as any).content }));
      const context = [...userContext, { role: 'assistant', content: assistantText }];
      if (assistantText.split(/\s+/).length >= 15) { // minimal substance
        // Fire and forget (non-blocking)
        this.titleGenerator.generate(context).then(title => {
          if (title && title !== 'New Chat') {
            this.chatModel.updateOne({ _id: chat._id, title: 'New Chat' }, { $set: { title } }).catch(()=>{});
          }
        }).catch(()=>{});
      }
    }

    return message;
  }

  async getMessagesWithEducationContext(userId: string, chatId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    
    const educationContext = await this.usersService.getEducationSystemContext(userId);
    const messages = chat.messages.map((m: any) => ({
      role: m.role,
      content: m.content,
      meta: m.meta
    }));
    
    // If user has an education system preference, add it as the first message
    if (educationContext) {
      return [
        {
          role: 'system',
          content: educationContext,
          meta: { isEducationSystemContext: true }
        },
        ...messages
      ];
    }
    
    return messages;
  }

  async removeMessage(userId: string, chatId: string, messageId: string) {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) throw new NotFoundException('Chat not found');
    this.ensureOwner(chat, userId);
    const idx = chat.messages.findIndex(m => (m as any).id === messageId);
    if (idx === -1) throw new NotFoundException('Message not found');
    const [removed] = chat.messages.splice(idx, 1);
    await chat.save();
    return removed;
  }

  async searchMessages(userId: string, query: string, limit = 20, offset = 0) {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { results: [], total: 0, limit, offset: 0, hasMore: false };
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);
    const escaped = this.escapeRegex(trimmed);
    const regex = new RegExp(escaped, 'i');

    const pipeline: any[] = [
      { $match: { userId: new Types.ObjectId(userId) } },
      { $project: { title: 1, messages: 1 } },
      { $unwind: { path: '$messages', includeArrayIndex: 'messageIndex' } },
      { $match: { 'messages.content': { $regex: regex } } },
      { $sort: { 'messages.createdAt': -1 } },
      {
        $facet: {
          data: [
            { $skip: safeOffset },
            { $limit: safeLimit },
            {
              $project: {
                chatId: '$_id',
                chatTitle: '$title',
                messageId: '$messages.id',
                messageContent: '$messages.content',
                messageRole: '$messages.role',
                messageCreatedAt: '$messages.createdAt',
                messageIndex: '$messageIndex',
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ];

    const [agg] = await this.chatModel.aggregate(pipeline);
    const rawResults = agg?.data || [];
    const total = agg?.total?.[0]?.count || 0;
    const results = rawResults.map((item: any) => ({
      chatId: item.chatId.toString(),
      chatTitle: item.chatTitle,
      messageId: item.messageId,
      messageContent: item.messageContent,
      messageRole: item.messageRole,
      messageCreatedAt: item.messageCreatedAt,
      messageIndex: item.messageIndex,
    }));
    const hasMore = safeOffset + results.length < total;

    return { results, total, limit: safeLimit, offset: safeOffset, hasMore };
  }
}
