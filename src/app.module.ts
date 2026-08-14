import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import hhElementsConfig from './config/hh.elements.config';
import hhUrlConfig from './config/hh.url.config';
import llmConfig from './config/llm.config';
import mainConfig from './config/main.config';
import settingsConfig from './config/settings/settings.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { LlmModule } from './llm/llm.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaService } from './prisma/prisma.service';
import { SettingsConfigService } from './config/settings/settings-config.service';
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
        hhUrlConfig,
        hhElementsConfig,
        llmConfig,
        settingsConfig,
      ],
    }),
    LoggerModule,
  ],
  providers: [PrismaService, SettingsConfigService],
})
export class AppModule {}
