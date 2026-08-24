import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import hhConfig from './config/hh.config';
import hhElementsConfig from './config/hh.elements.config';
import llmConfig from './config/llm.config';
import mainConfig from './config/main.config';
import { SettingsConfigModule } from './config/settings/settings-config.module';
import settingsConfig from './config/settings/settings.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { LlmModule } from './llm/llm.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelegramModule } from './telegram/telegram.module';

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
    SettingsConfigModule,
    LoggerModule,
    PrismaModule,
  ],
})
export class AppModule {}
