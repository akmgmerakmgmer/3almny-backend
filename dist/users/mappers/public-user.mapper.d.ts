import { User, UserDocument, EducationSystem, Grade, Subject } from '../user.entity';
export interface PublicUserDto {
    id?: string;
    username: string;
    email: string;
    provider: 'local' | 'google';
    educationSystem?: EducationSystem | null;
    grade?: Grade | null;
    subject?: Subject | null;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare function toPublicUser(user: UserDocument | User): PublicUserDto;
