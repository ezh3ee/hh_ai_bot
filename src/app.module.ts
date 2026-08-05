import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import mainConfig from './config/main.config';
import telegramConfig from './config/telegram.config';
import { HhModule } from './hh/hh.module';
import { TelegramModule } from './telegram/telegram.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    TelegramModule,
    HhModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mainConfig, telegramConfig],
    }),
    LoggerModule,
  ],
})
export class AppModule {}
