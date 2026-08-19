import { InjectBot } from '@grammyjs/nestjs';
import { Injectable } from '@nestjs/common';
import { Bot, Context } from 'grammy';
import { LoggerService } from '../../logger/logger.service';
import {
  renderVacancyCard,
  VacancyCardData,
} from '../renderers/vacancy-card.renderer';

@Injectable()
export class TelegramNotifyService {
  constructor(
    @InjectBot() private readonly bot: Bot<Context>,
    private readonly logger: LoggerService,
  ) {}

  async sendVacancyCard(
    chatId: string,
    data: VacancyCardData,
  ): Promise<number> {
    const { text, parse_mode, reply_markup } = renderVacancyCard(data);
    try {
      const msg = await this.bot.api.sendMessage(chatId, text, {
        parse_mode,
        reply_markup,
        link_preview_options: { is_disabled: true },
      });
      return msg.message_id;
    } catch (error) {
      this.logger.error(
        `Failed to send vacancy card to chat ${chatId}`,
        error as Error,
      );
      throw error;
    }
  }

  async updateVacancyCard(
    chatId: string,
    messageId: number,
    data: VacancyCardData,
  ): Promise<void> {
    const { text, parse_mode, reply_markup } = renderVacancyCard(data);
    try {
      await this.bot.api.editMessageText(chatId, messageId, text, {
        parse_mode,
        reply_markup,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update vacancy card in chat ${chatId}, message ${messageId}`,
      );
      throw error;
    }
  }
}
