import { IsEnum, IsInt, IsPositive } from 'class-validator';
import { VACANCY_REASON } from '../../generated/prisma/enums';

export class AddVacancyByIdDto {
  @IsInt()
  @IsPositive()
  id!: number;

  @IsEnum(VACANCY_REASON, {
    message: 'reason must be one of the following values: REJECTED, SENT',
  })
  reason!: VACANCY_REASON;
}
