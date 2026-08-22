import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VacancyService } from './vacancy.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [PrismaModule, LoggerModule],
  providers: [VacancyService],
  exports: [VacancyService],
})
export class VacancyModule {}
