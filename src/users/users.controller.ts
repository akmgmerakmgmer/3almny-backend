import { Controller, Put, Body, Get, UseGuards, Request, Post, Delete, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { toPublicUser } from './mappers/public-user.mapper';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { CreateStudyRecordDto } from './dto/create-study-record.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) {
      return { user: null };
    }
    return { user: toPublicUser(user) };
  }

  @Put('preferences')
  async updatePreferences(@Request() req: any, @Body() dto: UpdateUserPreferencesDto) {
    const user = await this.usersService.updatePreferences(req.user.userId, dto);
    return { user: toPublicUser(user) };
  }

  @Get('education-context')
  async getEducationContext(@Request() req: any) {
    const result = await this.usersService.getEducationSystemContext(req.user.userId);
    return result;
  }

  @Get('bookmarks')
  async getBookmarks(
    @Request() req: any,
    @Query('q') q?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const numericOffset = offset ? parseInt(offset, 10) : undefined;
    const numericLimit = limit ? parseInt(limit, 10) : undefined;
    const result = await this.usersService.getBookmarks(req.user.userId, {
      query: q,
      offset: Number.isFinite(numericOffset as number) ? numericOffset : undefined,
      limit: Number.isFinite(numericLimit as number) ? numericLimit : undefined,
    });
    return result;
  }

  @Post('bookmarks')
  async addBookmark(@Request() req: any, @Body() dto: CreateBookmarkDto) {
    const bookmark = await this.usersService.addBookmark(req.user.userId, dto);
    return bookmark;
  }

  @Delete('bookmarks/:bookmarkId')
  async removeBookmark(@Request() req: any, @Param('bookmarkId') bookmarkId: string) {
    await this.usersService.removeBookmark(req.user.userId, bookmarkId);
    return { success: true };
  }

  @Get('records')
  async getStudyRecords(
    @Request() req: any,
    @Query('subject') subject?: string,
    @Query('grade') grade?: string,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
  ) {
    const numericOffset = offset ? parseInt(offset, 10) : undefined;
    const numericLimit = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.getStudyRecords(req.user.userId, {
      subject,
      grade,
      offset: Number.isFinite(numericOffset as number) ? numericOffset : undefined,
      limit: Number.isFinite(numericLimit as number) ? numericLimit : undefined,
    });
  }

  @Get('records/filters')
  async getRecordsFilters(@Request() req: any) {
    return this.usersService.getRecordsFilters(req.user.userId);
  }

  @Post('records')
  async addStudyRecord(@Request() req: any, @Body() dto: CreateStudyRecordDto) {
    const record = await this.usersService.addStudyRecord(req.user.userId, dto);
    return { record };
  }

  @Delete('records/:recordId')
  async removeStudyRecord(@Request() req: any, @Param('recordId') recordId: string) {
    await this.usersService.removeStudyRecord(req.user.userId, recordId);
    return { success: true };
  }
}