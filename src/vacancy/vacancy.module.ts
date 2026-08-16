import { Module } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { VacancyService } from './vacancy.service';

@Module({
  providers: [VacancyService, LoggerService, PrismaService],
  exports: [VacancyService],
})
export class VacancyModule {}
