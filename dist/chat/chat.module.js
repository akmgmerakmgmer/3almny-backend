"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const chat_schema_1 = require("./chat.schema");
const chat_service_1 = require("./chat.service");
const education_classifier_service_1 = require("./education-classifier.service");
const title_generator_service_1 = require("./title-generator.service");
const chat_controller_1 = require("./chat.controller");
const users_module_1 = require("../users/users.module");
const practice_question_schema_1 = require("./practice-question.schema");
const practice_question_service_1 = require("./practice-question.service");
const course_recommendation_service_1 = require("./course-recommendation.service");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: chat_schema_1.Chat.name, schema: chat_schema_1.ChatSchema },
                { name: practice_question_schema_1.PracticeQuestion.name, schema: practice_question_schema_1.PracticeQuestionSchema },
            ]),
            users_module_1.UsersModule
        ],
        providers: [chat_service_1.ChatService, education_classifier_service_1.EducationClassifierService, title_generator_service_1.TitleGeneratorService, practice_question_service_1.PracticeQuestionService, course_recommendation_service_1.CourseRecommendationService],
        controllers: [chat_controller_1.ChatController],
        exports: [chat_service_1.ChatService, practice_question_service_1.PracticeQuestionService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map