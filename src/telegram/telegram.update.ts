import { Ctx, On, Start, Update } from '@grammyjs/nestjs';
import { Injectable } from '@nestjs/common';
import type { CallbackQueryContext } from 'grammy';
import { Context } from 'grammy';
import { parseCallbackData } from './schemas/callback.schema';
import { TelegramNotifyService } from './services/telegram-notify.service';
import { TelegramWaitService } from './services/telegram-wait.service';

const actionTypeMap = {
  send: 'SEND' as const,
  reject: 'REJECT' as const,
  edit: 'EDIT' as const,
} as const;

function extractChatId(ctx: Context): string | null {
  const rawId = ctx.chat?.id ?? ctx.from?.id;
  if (rawId === undefined || rawId === null) {
    return null;
  }
  return String(rawId);
}

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(
    private readonly waitService: TelegramWaitService,
    private readonly notifyService: TelegramNotifyService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply('Я автоматический бот для HH. Привет! 👋');
  }

  @On('callback_query:data')
  async onCallbackQuery(@Ctx() ctx: CallbackQueryContext<Context>) {
    // stop button animation once handling started
    await ctx.answerCallbackQuery().catch(() => null);
    const data = ctx.callbackQuery.data;
    const chatId = extractChatId(ctx);

    if (!chatId) {
      await ctx.answerCallbackQuery();
      return;
    }

    if (!data) return;

    const parsed = parseCallbackData(data);
    if (!parsed) {
      await ctx.answerCallbackQuery();
      return;
    }

    const actionType = actionTypeMap[parsed.type];

    this.waitService.resolveAction(chatId, {
      type: actionType,
      vacancyId: parsed.vacancyId,
    });

    await ctx.answerCallbackQuery();
  }

  @On('message:text')
  onTextMessage(@Ctx() ctx: Context) {
    const chatId = extractChatId(ctx);

    if (!chatId) return;

    const text = ctx.message?.text;

    if (text) {
      this.waitService.resolveText(chatId, text);
    }
  }
}
