import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import hhElementsConfig from './config/hh.elements.config';
import hhUrlConfig from './config/hh.url.config';
import mainConfig from './config/main.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { LoggerModule } from './logger/logger.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    TelegramModule,
    HhModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mainConfig, telegramConfig, hhUrlConfig, hhElementsConfig],
    }),
    LoggerModule,
  ],
  // providers: [EntryService],
})
export class AppModule {}
