import { NestjsGrammyModule } from '@grammyjs/nestjs';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import telegramConfig from '../config/telegram.config';
import { TelegramUpdate } from './telegram.update';

@Module({
  providers: [TelegramUpdate],
  imports: [
    NestjsGrammyModule.forRootAsync({
      inject: [telegramConfig.KEY],
      useFactory: (tgConfig: ConfigType<typeof telegramConfig>) => ({
        token: tgConfig.BOT_TOKEN,
      }),
    }),
  ],
})
export class TelegramModule {}
