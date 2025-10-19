import { EducationSystem, Grade, Subject } from '../user.entity';
export declare class UpdateUserPreferencesDto {
    educationSystem?: EducationSystem | null;
    grade?: Grade | null;
    subject?: Subject | null;
}
