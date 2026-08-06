import { Start, Update } from '@grammyjs/nestjs';
import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';

@Update()
@Injectable()
export class TelegramUpdate {
  //   constructor() {}

  @Start()
  async onStart(ctx: Context) {
    await ctx.reply('Я автоматический бот для HH. Привет! 👋');
  }
}
