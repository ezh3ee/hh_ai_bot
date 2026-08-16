import { IsInt, IsPositive } from 'class-validator';

export class CreateVacancyDto {
  @IsInt()
  @IsPositive()
  id!: number;
}
