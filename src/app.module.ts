import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import hhElementsConfig from './config/hh.elements.config';
import hhConfig from './config/hh.config';
import llmConfig from './config/llm.config';
import mainConfig from './config/main.config';
import settingsConfig from './config/settings/settings.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { LlmModule } from './llm/llm.module';
import { LoggerModule } from './logger/logger.module';
import { TelegramModule } from './telegram/telegram.module';
import { VacancyModule } from './vacancy/vacancy.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    TelegramModule,
    HhModule,
    LlmModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        mainConfig,
        telegramConfig,
        hhConfig,
        hhElementsConfig,
        llmConfig,
        settingsConfig,
      ],
    }),
    LoggerModule,
    VacancyModule,
    PrismaModule,
  ],
})
export class AppModule {}
