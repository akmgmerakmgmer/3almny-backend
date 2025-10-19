import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Chat, ChatSchema } from './chat.schema';
import { ChatService } from './chat.service';
import { EducationClassifierService } from './education-classifier.service';
import { TitleGeneratorService } from './title-generator.service';
import { ChatController } from './chat.controller';
import { UsersModule } from '../users/users.module';
import { PracticeQuestion, PracticeQuestionSchema } from './practice-question.schema';
import { PracticeQuestionService } from './practice-question.service';
import { CourseRecommendationService } from './course-recommendation.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Chat.name, schema: ChatSchema },
      { name: PracticeQuestion.name, schema: PracticeQuestionSchema },
    ]),
    UsersModule
  ],
  providers: [ChatService, EducationClassifierService, TitleGeneratorService, PracticeQuestionService, CourseRecommendationService],
  controllers: [ChatController],
  exports: [ChatService, PracticeQuestionService],
})
export class ChatModule {}
