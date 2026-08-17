import { IsInt, IsPositive } from 'class-validator';

export class AddVacancyByIdDto {
  @IsInt()
  @IsPositive()
  id!: number;
}
