import { NestjsGrammyModule } from '@grammyjs/nestjs';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import telegramConfig from '../config/telegram.config';
import { TelegramUpdate } from './telegram.update';
import { TelegramNotifyService } from './services/telegram-notify.service';
import { TelegramWaitService } from './services/telegram-wait.service';

@Module({
  providers: [TelegramUpdate, TelegramNotifyService, TelegramWaitService],
  imports: [
    NestjsGrammyModule.forRootAsync({
      inject: [telegramConfig.KEY],
      useFactory: (tgConfig: ConfigType<typeof telegramConfig>) => ({
        token: tgConfig.BOT_TOKEN,
      }),
    }),
  ],
  exports: [TelegramNotifyService, TelegramWaitService],
})
export class TelegramModule {}
