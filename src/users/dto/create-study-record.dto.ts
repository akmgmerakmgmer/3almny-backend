import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateStudyRecordDto {
  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsString()
  @IsNotEmpty()
  subject!: string;
}
