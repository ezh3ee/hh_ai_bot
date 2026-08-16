import { Module } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { VacancyService } from './vacancy.service';

@Module({
  providers: [VacancyService, LoggerService],
  exports: [VacancyService],
})
export class VacancyModule {}
