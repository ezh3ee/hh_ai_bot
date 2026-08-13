import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import hhElementsConfig from './config/hh.elements.config';
import hhUrlConfig from './config/hh.url.config';
import mainConfig from './config/main.config';
import { SettingsConfigService } from './config/settings/settings-config.service';
import settingsConfig from './config/settings/settings.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { LoggerModule } from './logger/logger.module';
import { PrismaService } from './prisma/prisma.service';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    TelegramModule,
    HhModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        mainConfig,
        telegramConfig,
        hhUrlConfig,
        hhElementsConfig,
        settingsConfig,
      ],
    }),
    LoggerModule,
  ],
  providers: [PrismaService, SettingsConfigService],
})
export class AppModule {}
