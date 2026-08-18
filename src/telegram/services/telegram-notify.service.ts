import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { InjectBot } from '@grammyjs/nestjs';
import {
  renderVacancyCard,
  VacancyCardData,
} from '../renderers/vacancy-card.renderer';

@Injectable()
export class TelegramNotifyService {
  constructor(@InjectBot() private readonly bot: Bot<Context>) {}

  async sendVacancyCard(
    chatId: string,
    data: VacancyCardData,
  ): Promise<number> {
    const { text, parse_mode, reply_markup } = renderVacancyCard(data);
    const msg = await this.bot.api.sendMessage(chatId, text, {
      parse_mode,
      reply_markup,
      link_preview_options: { is_disabled: true },
    });
    return msg.message_id;
  }

  async updateVacancyCard(
    chatId: string,
    messageId: number,
    data: VacancyCardData,
  ): Promise<void> {
    const { text, parse_mode, reply_markup } = renderVacancyCard(data);
    await this.bot.api.editMessageText(chatId, messageId, text, {
      parse_mode,
      reply_markup,
    });
  }
}
