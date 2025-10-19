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

export function toPublicUser(user: UserDocument | User): PublicUserDto {
  const plain: any = typeof (user as any).toObject === 'function' ? (user as any).toObject() : user;
  return {
    id: plain.id || plain._id?.toString?.(),
    username: plain.username,
    email: plain.email,
    provider: plain.provider,
    educationSystem: plain.educationSystem,
    grade: plain.grade,
    subject: plain.subject,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}
