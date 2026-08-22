import { Injectable } from '@nestjs/common';
import { Prisma, Vacancy } from '../generated/prisma/client';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { AddVacancyByIdDto } from './dto/add-vacancy-by-id.dto';

@Injectable()
export class VacancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async addVacancy(vacancy: AddVacancyByIdDto): Promise<Vacancy | null> {
    try {
      return await this.prisma.vacancy.create({ data: vacancy });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          this.logger.warn(`Vacancy with ID ${vacancy.id} already exists`, {
            action: 'addVacancy',
          });
          return null;
        }

        this.logger.error(
          `Prisma error adding vacancy ${vacancy.id}`,
          e.message,
          {
            action: 'addVacancy',
          },
        );
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.logger.error(
          `Unexpected error adding vacancy ${vacancy.id}`,
          errorMessage,
          { action: 'addVacancy' },
        );
      }

      throw e;
    }
  }

  async getVacancy(id: number): Promise<Vacancy | null> {
    return await this.prisma.vacancy.findUnique({
      where: { id },
    });
  }

  async deleteVacancy(id: number): Promise<Vacancy | null> {
    try {
      return await this.prisma.vacancy.delete({
        where: { id },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          this.logger.warn(`Vacancy ${id} not found for deletion`, {
            action: 'deleteVacancy',
          });
          return null;
        }

        this.logger.error(`Prisma error deleting vacancy ${id}`, e.message, {
          action: 'deleteVacancy',
        });
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        this.logger.error(
          `Unexpected error deleting vacancy ${id}`,
          errorMessage,
          {
            action: 'deleteVacancy',
          },
        );
      }

      return null;
    }
  }
}
