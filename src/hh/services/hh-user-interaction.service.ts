import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Locator, Page } from 'playwright';
import hhConfig, { type HhConfig } from '../../config/hh.config';
import hhElementsConfig from '../../config/hh.elements.config';
import telegramConfig from '../../config/telegram.config';
import { LLMService } from '../../llm/llm.service';
import { Candidate, Vacancy } from '../../llm/llm.types';
import { LoggerService } from '../../logger/logger.service';
import { TelegramNotifyService } from '../../telegram/services/telegram-notify.service';
import { TelegramWaitService } from '../../telegram/services/telegram-wait.service';
import { VacancyService } from '../../vacancy/vacancy.service';

@Injectable()
export class HhUserInteractionService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly hhConfig: HhConfig,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    @Inject(telegramConfig.KEY)
    private readonly tgConfig: ConfigType<typeof telegramConfig>,
    private readonly llmService: LLMService,
    private readonly telegramNotify: TelegramNotifyService,
    private readonly telegramWait: TelegramWaitService,
    private readonly vacancyService: VacancyService,
    private readonly logger: LoggerService,
  ) {}

  async handleResponseFlow(
    page: Page,
    vacancyData: Vacancy,
    candidate: Candidate,
  ): Promise<{ action: 'SEND' | 'REJECT' | 'TIMEOUT'; coverLetter: string }> {
    let additionalInstructions = '';
    let messageId: number | null = null;
    let hasQuestionnaire = false;

    const vacancyId = vacancyData.url.match(/\/vacancy\/(\d+)/)?.[1]
      ? parseInt(vacancyData.url.match(/\/vacancy\/(\d+)/)?.[1] ?? '0', 10)
      : 0;

    await this.openResponsePage(page);
    await page.waitForLoadState('domcontentloaded');
    await new Promise((resolve) =>
      setTimeout(resolve, this.hhConfig.HH_PAGE_LOAD_DELAY_MS),
    );

    let cardData: {
      id: number;
      title: string;
      url: string;
      workFormat: string | undefined;
      salary: string | undefined;
      coverLetter: string;
      hasQuestionnaire: boolean;
    } | null = null;

    while (true) {
      const coverLetter = await this.llmService.generateCoverLetter(
        vacancyData,
        candidate,
        additionalInstructions,
      );

      let additionalForm: Locator | null = null;
      try {
        additionalForm = page.locator(this.elementConfig.HH_IS_ADDITIONAL_FORM);
      } catch {
        this.logger.log(`[Interaction] Additional form not found`);
      }

      hasQuestionnaire = additionalForm
        ? (await additionalForm.count()) > 0
        : false;

      cardData = {
        id: vacancyId,
        title: vacancyData.title,
        url: vacancyData.url,
        workFormat: vacancyData.location,
        salary: vacancyData.salary,
        coverLetter,
        hasQuestionnaire,
      };

      if (messageId === null) {
        messageId = await this.telegramNotify.sendVacancyCard(
          this.tgConfig.CHAT_ID,
          cardData,
        );
      } else {
        await this.telegramNotify.updateVacancyCard(
          this.tgConfig.CHAT_ID,
          messageId,
          cardData,
        );

        await this.telegramNotify.sendText(
          this.tgConfig.CHAT_ID,
          'Сопроводительное письмо обновлено.',
          messageId,
        );
      }

      this.logger.log(
        `[Interaction] Sent vacancy card to Telegram for vacancy ${cardData.id}`,
      );

      let action: {
        type: 'SEND' | 'REJECT' | 'EDIT';
        vacancyId: number | null;
      };
      try {
        action = await this.telegramWait.waitForAction(this.tgConfig.CHAT_ID);
      } catch (error) {
        this.logger.error(
          `[Interaction] Telegram wait timeout for vacancy ${cardData?.id ?? vacancyId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
        await this.vacancyService.addVacancy({ id: cardData?.id ?? vacancyId });
        return { action: 'TIMEOUT', coverLetter };
      }

      switch (action.type) {
        case 'REJECT': {
          await this.vacancyService.addVacancy({ id: cardData.id });
          this.logger.log(
            `[Interaction] Vacancy ${cardData.id} rejected by user, saved to DB`,
          );

          const successText = `\n\n❌❌❌ВАКАНСИЯ ОТКЛОНЕНА❌❌❌`;
          cardData.coverLetter = cardData.coverLetter + successText;

          await this.telegramNotify.updateVacancyCard(
            this.tgConfig.CHAT_ID,
            messageId,
            cardData,
          );

          return { action: 'REJECT', coverLetter };
        }
        case 'EDIT': {
          try {
            await this.telegramNotify.sendText(
              this.tgConfig.CHAT_ID,
              'Введите дополнительные инструкции для написания более точного сопроводительного письма',
              messageId,
            );

            const instructions = await this.telegramWait.waitForText(
              this.tgConfig.CHAT_ID,
            );

            additionalInstructions = instructions;
            this.logger.log(
              `[Interaction] Received edit instructions for vacancy ${cardData.id}`,
            );
            continue;
          } catch (error) {
            this.logger.error(
              `[Interaction] Failed to get edit instructions for vacancy ${cardData.id}`,
              error instanceof Error ? error : new Error(String(error)),
            );

            return { action: 'TIMEOUT', coverLetter };
          }
        }
        case 'SEND': {
          this.logger.log(
            `[Interaction] User approved sending response for vacancy ${cardData.id}`,
          );

          await this.vacancyService.addVacancy({ id: cardData.id });

          const successText = `\n\n✅✅✅ОСТАВЛЕН ОТКЛИК✅✅✅`;
          cardData.coverLetter = cardData.coverLetter + successText;

          await this.telegramNotify.updateVacancyCard(
            this.tgConfig.CHAT_ID,
            messageId,
            cardData,
          );

          return { action: 'SEND', coverLetter };
        }
      }
    }
  }

  private async openResponsePage(page: Page): Promise<void> {
    const vacancyId = page.url().match(/\/vacancy\/(\d+)/)?.[1];
    if (!vacancyId) {
      this.logger.error(
        '[Interaction] Could not extract vacancyId from URL',
        new Error('vacancyId not found in URL'),
      );
      return;
    }
    const responseUrl = `${this.hhConfig.HH_MAIN_URL}/applicant/vacancy_response?vacancyId=${vacancyId}`;
    await page.goto(responseUrl, { waitUntil: 'domcontentloaded' });
  }
}
