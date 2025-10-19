import { MessageEvent } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { TitleGeneratorService } from './title-generator.service';
import { UsersService } from '../users/users.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Request } from 'express';
import { PracticeQuestionService } from './practice-question.service';
import { GeneratePracticeQuestionsDto } from './dto/generate-practice-questions.dto';
import { SubmitPracticeQuestionDto } from './dto/submit-practice-question.dto';
import { UpdatePracticeQuestionDto } from './dto/update-practice-question.dto';
import { Observable } from 'rxjs';
import { CourseRecommendationService } from './course-recommendation.service';
export declare class ChatController {
    private readonly chats;
    private readonly titleGen;
    private readonly usersService;
    private readonly practiceQuestions;
    private readonly courseRecommendations;
    constructor(chats: ChatService, titleGen: TitleGeneratorService, usersService: UsersService, practiceQuestions: PracticeQuestionService, courseRecommendations: CourseRecommendationService);
    private userId;
    create(req: Request, dto: CreateChatDto): Promise<{
        success: boolean;
        data: import("mongoose").FlattenMaps<import("./chat.schema").Chat & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }>;
    }>;
    list(req: Request, limit?: string, offset?: string): Promise<{
        data: {
            id: import("mongoose").FlattenMaps<unknown>;
            _id: undefined;
            title: string;
            userId: import("mongoose").Types.ObjectId;
            messages: import("mongoose").FlattenMaps<import("./chat.schema").ChatMessage>[];
            createdAt: Date;
            updatedAt?: Date | undefined;
            $assertPopulated: <Paths = {}>(path: string | string[], values?: Partial<Paths> | undefined) => Omit<import("./chat.schema").ChatDocument, keyof Paths> & Paths;
            $clearModifiedPaths: () => import("./chat.schema").ChatDocument;
            $clone: () => import("./chat.schema").ChatDocument;
            $createModifiedPathsSnapshot: () => import("mongoose").ModifiedPathsSnapshot;
            $getAllSubdocs: () => import("mongoose").Document[];
            $ignore: (path: string) => void;
            $isDefault: (path?: string) => boolean;
            $isDeleted: (val?: boolean) => boolean;
            $getPopulatedDocs: () => import("mongoose").Document[];
            $inc: (path: string | string[], val?: number) => import("./chat.schema").ChatDocument;
            $isEmpty: (path: string) => boolean;
            $isValid: (path: string) => boolean;
            $locals: import("mongoose").FlattenMaps<Record<string, unknown>>;
            $markValid: (path: string) => void;
            $model: {
                <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                    _id: import("mongoose").Types.ObjectId;
                } & {
                    __v: number;
                }, any>>(name: string): ModelType;
                <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
            };
            $op: "save" | "validate" | "remove" | null;
            $restoreModifiedPathsSnapshot: (snapshot: import("mongoose").ModifiedPathsSnapshot) => import("./chat.schema").ChatDocument;
            $session: (session?: import("mongoose").ClientSession | null) => import("mongoose").ClientSession | null;
            $set: {
                (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (value: string | Record<string, any>): import("./chat.schema").ChatDocument;
            };
            $where: import("mongoose").FlattenMaps<Record<string, unknown>>;
            baseModelName?: string | undefined;
            collection: import("mongoose").FlattenMaps<import("mongoose").Collection<import("bson").Document>>;
            db: import("mongoose").FlattenMaps<import("mongoose").Connection>;
            deleteOne: (options?: import("mongoose").QueryOptions) => any;
            depopulate: <Paths = {}>(path?: string | string[]) => import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>;
            directModifiedPaths: () => Array<string>;
            equals: (doc: import("mongoose").Document<unknown, any, any, Record<string, any>, {}>) => boolean;
            errors?: import("mongoose").Error.ValidationError | undefined;
            get: {
                <T extends string | number | symbol>(path: T, type?: any, options?: any): any;
                (path: string, type?: any, options?: any): any;
            };
            getChanges: () => import("mongoose").UpdateQuery<import("./chat.schema").ChatDocument>;
            increment: () => import("./chat.schema").ChatDocument;
            init: (obj: import("mongoose").AnyObject, opts?: import("mongoose").AnyObject) => import("./chat.schema").ChatDocument;
            invalidate: {
                <T extends string | number | symbol>(path: T, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
                (path: string, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
            };
            isDirectModified: {
                <T extends string | number | symbol>(path: T | T[]): boolean;
                (path: string | Array<string>): boolean;
            };
            isDirectSelected: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            isInit: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            isModified: {
                <T extends string | number | symbol>(path?: T | T[] | undefined, options?: {
                    ignoreAtomics?: boolean;
                } | null): boolean;
                (path?: string | Array<string>, options?: {
                    ignoreAtomics?: boolean;
                } | null): boolean;
            };
            isNew: boolean;
            isSelected: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            markModified: {
                <T extends string | number | symbol>(path: T, scope?: any): void;
                (path: string, scope?: any): void;
            };
            model: {
                <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                    _id: import("mongoose").Types.ObjectId;
                } & {
                    __v: number;
                }, any>>(name: string): ModelType;
                <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
            };
            modifiedPaths: (options?: {
                includeChildren?: boolean;
            }) => Array<string>;
            overwrite: (obj: import("mongoose").AnyObject) => import("./chat.schema").ChatDocument;
            $parent: () => import("mongoose").Document | undefined;
            populate: {
                <Paths = {}>(path: string | import("mongoose").PopulateOptions | (string | import("mongoose").PopulateOptions)[]): Promise<import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>>;
                <Paths = {}>(path: string, select?: string | import("mongoose").AnyObject, model?: import("mongoose").Model<any>, match?: import("mongoose").AnyObject, options?: import("mongoose").PopulateOptions): Promise<import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>>;
            };
            populated: (path: string) => any;
            replaceOne: (replacement?: import("mongoose").AnyObject, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("./chat.schema").ChatDocument, {}, unknown, "find", Record<string, never>>;
            save: (options?: import("mongoose").SaveOptions) => Promise<import("./chat.schema").ChatDocument>;
            schema: import("mongoose").FlattenMaps<import("mongoose").Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
                [x: string]: unknown;
            }, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
                [x: string]: unknown;
            }>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
                [x: string]: unknown;
            }> & Required<{
                _id: unknown;
            }> & {
                __v: number;
            }>>;
            set: {
                <T extends string | number | symbol>(path: T, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (value: string | Record<string, any>): import("./chat.schema").ChatDocument;
            };
            toJSON: {
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                    flattenObjectIds: true;
                }): Omit<{
                    [x: string]: any;
                }, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                    [x: number]: any;
                    [x: symbol]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                }): Omit<any, "__v">;
                (options?: import("mongoose").ToObjectOptions & {
                    flattenMaps?: true;
                    flattenObjectIds?: false;
                }): import("mongoose").FlattenMaps<any>;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: false;
                }): import("mongoose").FlattenMaps<any>;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                    flattenObjectIds: true;
                }): any;
                <T = any>(options?: import("mongoose").ToObjectOptions & {
                    flattenMaps?: true;
                    flattenObjectIds?: false;
                }): import("mongoose").FlattenMaps<T>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: false;
                }): import("mongoose").FlattenMaps<T>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): import("mongoose").ObjectIdToString<import("mongoose").FlattenMaps<T>>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                }): T;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                    flattenObjectIds: true;
                }): import("mongoose").ObjectIdToString<T>;
            };
            toObject: {
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                    flattenObjectIds: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                    flattenObjectIds: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    flattenObjectIds: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): any;
                (options?: import("mongoose").ToObjectOptions): any;
                <T>(options?: import("mongoose").ToObjectOptions): import("mongoose").Require_id<T> & {
                    __v: number;
                };
            };
            unmarkModified: {
                <T extends string | number | symbol>(path: T): void;
                (path: string): void;
            };
            updateOne: (update?: import("mongoose").UpdateWithAggregationPipeline | import("mongoose").UpdateQuery<import("./chat.schema").ChatDocument> | undefined, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("./chat.schema").ChatDocument, {}, unknown, "find", Record<string, never>>;
            validate: {
                <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): Promise<void>;
                (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): Promise<void>;
                (options: {
                    pathsToSkip?: import("mongoose").pathsToSkip;
                }): Promise<void>;
            };
            validateSync: {
                (options: {
                    pathsToSkip?: import("mongoose").pathsToSkip;
                    [k: string]: any;
                }): import("mongoose").Error.ValidationError | null;
                <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
                (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
            };
            __v: number;
        }[];
        total: number;
        limit: number;
        offset: number;
        nextOffset: number | null;
        success: boolean;
    }>;
    getCourseRecommendations(req: Request, topic?: string, language?: string, count?: string): Promise<{
        success: boolean;
        data: {
            courses: import("./course-recommendation.service").CourseRecommendation[];
            language: "ar" | "en";
            topic: string;
        };
    }>;
    searchMessages(req: Request, q: string, limit?: string, offset?: string): Promise<{
        results: any;
        total: any;
        limit: number;
        offset: number;
        hasMore: boolean;
        success: boolean;
    }>;
    listByUser(req: Request, userId: string): Promise<{
        success: boolean;
        data: {
            id: import("mongoose").FlattenMaps<unknown>;
            _id: undefined;
            title: string;
            userId: import("mongoose").Types.ObjectId;
            messages: import("mongoose").FlattenMaps<import("./chat.schema").ChatMessage>[];
            createdAt: Date;
            updatedAt?: Date | undefined;
            $assertPopulated: <Paths = {}>(path: string | string[], values?: Partial<Paths> | undefined) => Omit<import("./chat.schema").ChatDocument, keyof Paths> & Paths;
            $clearModifiedPaths: () => import("./chat.schema").ChatDocument;
            $clone: () => import("./chat.schema").ChatDocument;
            $createModifiedPathsSnapshot: () => import("mongoose").ModifiedPathsSnapshot;
            $getAllSubdocs: () => import("mongoose").Document[];
            $ignore: (path: string) => void;
            $isDefault: (path?: string) => boolean;
            $isDeleted: (val?: boolean) => boolean;
            $getPopulatedDocs: () => import("mongoose").Document[];
            $inc: (path: string | string[], val?: number) => import("./chat.schema").ChatDocument;
            $isEmpty: (path: string) => boolean;
            $isValid: (path: string) => boolean;
            $locals: import("mongoose").FlattenMaps<Record<string, unknown>>;
            $markValid: (path: string) => void;
            $model: {
                <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                    _id: import("mongoose").Types.ObjectId;
                } & {
                    __v: number;
                }, any>>(name: string): ModelType;
                <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
            };
            $op: "save" | "validate" | "remove" | null;
            $restoreModifiedPathsSnapshot: (snapshot: import("mongoose").ModifiedPathsSnapshot) => import("./chat.schema").ChatDocument;
            $session: (session?: import("mongoose").ClientSession | null) => import("mongoose").ClientSession | null;
            $set: {
                (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (value: string | Record<string, any>): import("./chat.schema").ChatDocument;
            };
            $where: import("mongoose").FlattenMaps<Record<string, unknown>>;
            baseModelName?: string | undefined;
            collection: import("mongoose").FlattenMaps<import("mongoose").Collection<import("bson").Document>>;
            db: import("mongoose").FlattenMaps<import("mongoose").Connection>;
            deleteOne: (options?: import("mongoose").QueryOptions) => any;
            depopulate: <Paths = {}>(path?: string | string[]) => import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>;
            directModifiedPaths: () => Array<string>;
            equals: (doc: import("mongoose").Document<unknown, any, any, Record<string, any>, {}>) => boolean;
            errors?: import("mongoose").Error.ValidationError | undefined;
            get: {
                <T extends string | number | symbol>(path: T, type?: any, options?: any): any;
                (path: string, type?: any, options?: any): any;
            };
            getChanges: () => import("mongoose").UpdateQuery<import("./chat.schema").ChatDocument>;
            increment: () => import("./chat.schema").ChatDocument;
            init: (obj: import("mongoose").AnyObject, opts?: import("mongoose").AnyObject) => import("./chat.schema").ChatDocument;
            invalidate: {
                <T extends string | number | symbol>(path: T, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
                (path: string, errorMsg: string | NativeError, value?: any, kind?: string): NativeError | null;
            };
            isDirectModified: {
                <T extends string | number | symbol>(path: T | T[]): boolean;
                (path: string | Array<string>): boolean;
            };
            isDirectSelected: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            isInit: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            isModified: {
                <T extends string | number | symbol>(path?: T | T[] | undefined, options?: {
                    ignoreAtomics?: boolean;
                } | null): boolean;
                (path?: string | Array<string>, options?: {
                    ignoreAtomics?: boolean;
                } | null): boolean;
            };
            isNew: boolean;
            isSelected: {
                <T extends string | number | symbol>(path: T): boolean;
                (path: string): boolean;
            };
            markModified: {
                <T extends string | number | symbol>(path: T, scope?: any): void;
                (path: string, scope?: any): void;
            };
            model: {
                <ModelType = import("mongoose").Model<unknown, {}, {}, {}, import("mongoose").Document<unknown, {}, unknown, {}, {}> & {
                    _id: import("mongoose").Types.ObjectId;
                } & {
                    __v: number;
                }, any>>(name: string): ModelType;
                <ModelType = import("mongoose").Model<any, {}, {}, {}, any, any>>(): ModelType;
            };
            modifiedPaths: (options?: {
                includeChildren?: boolean;
            }) => Array<string>;
            overwrite: (obj: import("mongoose").AnyObject) => import("./chat.schema").ChatDocument;
            $parent: () => import("mongoose").Document | undefined;
            populate: {
                <Paths = {}>(path: string | import("mongoose").PopulateOptions | (string | import("mongoose").PopulateOptions)[]): Promise<import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>>;
                <Paths = {}>(path: string, select?: string | import("mongoose").AnyObject, model?: import("mongoose").Model<any>, match?: import("mongoose").AnyObject, options?: import("mongoose").PopulateOptions): Promise<import("mongoose").MergeType<import("./chat.schema").ChatDocument, Paths>>;
            };
            populated: (path: string) => any;
            replaceOne: (replacement?: import("mongoose").AnyObject, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("./chat.schema").ChatDocument, {}, unknown, "find", Record<string, never>>;
            save: (options?: import("mongoose").SaveOptions) => Promise<import("./chat.schema").ChatDocument>;
            schema: import("mongoose").FlattenMaps<import("mongoose").Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
                [x: string]: unknown;
            }, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
                [x: string]: unknown;
            }>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
                [x: string]: unknown;
            }> & Required<{
                _id: unknown;
            }> & {
                __v: number;
            }>>;
            set: {
                <T extends string | number | symbol>(path: T, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, type: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (path: string | Record<string, any>, val: any, options?: import("mongoose").DocumentSetOptions): import("./chat.schema").ChatDocument;
                (value: string | Record<string, any>): import("./chat.schema").ChatDocument;
            };
            toJSON: {
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                    flattenObjectIds: true;
                }): Omit<{
                    [x: string]: any;
                }, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                    [x: number]: any;
                    [x: symbol]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                }): Omit<any, "__v">;
                (options?: import("mongoose").ToObjectOptions & {
                    flattenMaps?: true;
                    flattenObjectIds?: false;
                }): import("mongoose").FlattenMaps<any>;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: false;
                }): import("mongoose").FlattenMaps<any>;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): {
                    [x: string]: any;
                };
                (options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                    flattenObjectIds: true;
                }): any;
                <T = any>(options?: import("mongoose").ToObjectOptions & {
                    flattenMaps?: true;
                    flattenObjectIds?: false;
                }): import("mongoose").FlattenMaps<T>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: false;
                }): import("mongoose").FlattenMaps<T>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): import("mongoose").ObjectIdToString<import("mongoose").FlattenMaps<T>>;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                }): T;
                <T = any>(options: import("mongoose").ToObjectOptions & {
                    flattenMaps: false;
                    flattenObjectIds: true;
                }): import("mongoose").ObjectIdToString<T>;
            };
            toObject: {
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                    flattenObjectIds: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                    flattenObjectIds: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    flattenObjectIds: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                    virtuals: true;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    virtuals: true;
                }): any;
                (options: import("mongoose").ToObjectOptions & {
                    versionKey: false;
                }): Omit<any, "__v">;
                (options: import("mongoose").ToObjectOptions & {
                    flattenObjectIds: true;
                }): any;
                (options?: import("mongoose").ToObjectOptions): any;
                <T>(options?: import("mongoose").ToObjectOptions): import("mongoose").Require_id<T> & {
                    __v: number;
                };
            };
            unmarkModified: {
                <T extends string | number | symbol>(path: T): void;
                (path: string): void;
            };
            updateOne: (update?: import("mongoose").UpdateWithAggregationPipeline | import("mongoose").UpdateQuery<import("./chat.schema").ChatDocument> | undefined, options?: import("mongoose").QueryOptions | null) => import("mongoose").Query<any, import("./chat.schema").ChatDocument, {}, unknown, "find", Record<string, never>>;
            validate: {
                <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): Promise<void>;
                (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): Promise<void>;
                (options: {
                    pathsToSkip?: import("mongoose").pathsToSkip;
                }): Promise<void>;
            };
            validateSync: {
                (options: {
                    pathsToSkip?: import("mongoose").pathsToSkip;
                    [k: string]: any;
                }): import("mongoose").Error.ValidationError | null;
                <T extends string | number | symbol>(pathsToValidate?: T | T[] | undefined, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
                (pathsToValidate?: import("mongoose").pathsToValidate, options?: import("mongoose").AnyObject): import("mongoose").Error.ValidationError | null;
            };
            __v: number;
        }[];
    }>;
    exportPdf(req: Request, id: string, messageId: string | undefined, res: Response): Promise<void>;
    get(req: Request, id: string): Promise<{
        success: boolean;
        data: import("mongoose").FlattenMaps<import("./chat.schema").Chat & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }>;
    }>;
    update(req: Request, id: string, dto: UpdateChatDto): Promise<{
        success: boolean;
        data: import("mongoose").FlattenMaps<import("./chat.schema").Chat & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        }>;
    }>;
    delete(req: Request, id: string): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
    }>;
    addMessage(req: Request, id: string, dto: CreateMessageDto): Promise<{
        success: boolean;
        data: any;
    }>;
    removeMessage(req: Request, id: string, messageId: string): Promise<{
        success: boolean;
        data: import("./chat.schema").ChatMessage;
    }>;
    getMessagesWithEducationContext(req: Request, id: string): Promise<{
        success: boolean;
        data: {
            role: any;
            content: any;
            meta: any;
        }[];
    }>;
    streamPracticeQuestions(req: Request, chatId: string, messageId: string, difficulty?: string, count?: string, language?: string): Observable<MessageEvent>;
    generatePracticeQuestions(req: Request, chatId: string, messageId: string, dto: GeneratePracticeQuestionsDto): Promise<{
        success: boolean;
        data: {
            id: any;
            chatId: any;
            messageId: any;
            question: any;
            type: import("./practice-question.schema").PracticeQuestionType;
            difficulty: import("./practice-question.schema").PracticeDifficulty;
            options: any;
            explanation: any;
            language: any;
            autoGraded: any;
            archived: any;
            stats: {
                attempts: any;
                correctAttempts: any;
                accuracy: number | null;
            };
            createdAt: any;
            updatedAt: any;
            sourceSummary: any;
            sourceTitle: any;
        }[];
    }>;
    getPracticeQuestions(req: Request, chatId: string, messageId: string, includeArchived?: string): Promise<{
        success: boolean;
        data: {
            id: any;
            chatId: any;
            messageId: any;
            question: any;
            type: import("./practice-question.schema").PracticeQuestionType;
            difficulty: import("./practice-question.schema").PracticeDifficulty;
            options: any;
            explanation: any;
            language: any;
            autoGraded: any;
            archived: any;
            stats: {
                attempts: any;
                correctAttempts: any;
                accuracy: number | null;
            };
            createdAt: any;
            updatedAt: any;
            sourceSummary: any;
            sourceTitle: any;
        }[];
    }>;
    submitPracticeQuestion(req: Request, questionId: string, dto: SubmitPracticeQuestionDto): Promise<{
        success: true;
        data: any;
    }>;
    updatePracticeQuestion(req: Request, questionId: string, dto: UpdatePracticeQuestionDto): Promise<{
        success: boolean;
        data: {
            id: any;
            chatId: any;
            messageId: any;
            question: any;
            type: import("./practice-question.schema").PracticeQuestionType;
            difficulty: import("./practice-question.schema").PracticeDifficulty;
            options: any;
            explanation: any;
            language: any;
            autoGraded: any;
            archived: any;
            stats: {
                attempts: any;
                correctAttempts: any;
                accuracy: number | null;
            };
            createdAt: any;
            updatedAt: any;
            sourceSummary: any;
            sourceTitle: any;
        };
    }>;
    getPracticeStatistics(req: Request): Promise<{
        success: boolean;
        data: {
            difficulty: import("./practice-question.schema").PracticeDifficulty;
            total: any;
            archived: any;
            attempts: any;
            correctAttempts: any;
            accuracy: number | null;
        }[];
    }>;
}
