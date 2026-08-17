import { Module } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VacancyService } from './vacancy.service';

@Module({
  imports: [PrismaModule],
  providers: [VacancyService, LoggerService],
  exports: [VacancyService],
})
export class VacancyModule {}
