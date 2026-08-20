import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Locator, Page } from 'playwright';
import hhElementsConfig from '../../config/hh.elements.config';
import hhUrlConfig from '../../config/hh.url.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import telegramConfig, { type TgConfig } from '../../config/telegram.config';
import { LLMService } from '../../llm/llm.service';
import { Candidate, Vacancy } from '../../llm/llm.types';
import { LoggerService } from '../../logger/logger.service';
import { TelegramNotifyService } from '../../telegram/services/telegram-notify.service';
import { TelegramWaitService } from '../../telegram/services/telegram-wait.service';
import { VacancyService } from '../../vacancy/vacancy.service';
import { HhBrowserService } from './hh-browser.service';
import { VacancyFilterService } from './vacancy-filter.service';

@Injectable()
export class HhCrawlerService {
  constructor(
    @Inject(hhUrlConfig.KEY)
    private readonly urlConfig: ConfigType<typeof hhUrlConfig>,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    @Inject(telegramConfig.KEY)
    private readonly telegramConfig: TgConfig,
    private readonly settings: SettingsConfigService,
    private readonly browserService: HhBrowserService,
    private readonly vacancyService: VacancyService,
    private readonly llmService: LLMService,
    private readonly telegramNotify: TelegramNotifyService,
    private readonly telegramWait: TelegramWaitService,
    private readonly filterService: VacancyFilterService,
    private readonly logger: LoggerService,
  ) {}

  async crawl(): Promise<void> {
    this.validateSettings();
    this.logger.log('[Crawler] Starting vacancy search...');

    const areas = this.settings.hh.areas;
    const searchQueries = this.settings.hh.search_queries;

    for (const area of areas) {
      await this.processArea(area, searchQueries);
    }

    this.logger.log('[Crawler] Search completed');
  }

  private validateSettings(): void {
    if (!this.settings.hh.search_queries?.length) {
      throw new Error(
        '[Settings] search_queries is required and cannot be empty',
      );
    }
    if (!this.settings.hh.areas?.length) {
      throw new Error('[Settings] areas is required and cannot be empty');
    }
    if (!this.settings.hh.resume_name?.trim()) {
      throw new Error('[Settings] resume_name is required and cannot be empty');
    }
    this.logger.log('[Crawler] Settings validated successfully');
  }

  private async processArea(
    area: string,
    searchQueries: string[],
  ): Promise<void> {
    this.logger.log(`[Crawler] Processing area: ${area}`);

    for (const keyword of searchQueries) {
      await this.processKeyword(area, keyword);
    }
  }

  private async processKeyword(area: string, keyword: string): Promise<void> {
    this.logger.log(
      `[Crawler] Processing keyword: "${keyword}" in area: ${area}`,
    );

    const firstPageUrl = this.buildSearchUrl(area, keyword, 0);
    const page = await this.browserService.newPage();

    try {
      await page.goto(firstPageUrl, { waitUntil: 'networkidle' });
      const totalPages = await this.getTotalPages(page);
      this.logger.log(`[Crawler] Total pages: ${totalPages}`);

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          const pageUrl = this.buildSearchUrl(area, keyword, pageNum);
          await page.goto(pageUrl, { waitUntil: 'networkidle' });
        }
        await this.processPage(page, area, keyword, pageNum);
      }
    } finally {
      await page.close();
    }
  }

  private buildSearchUrl(
    area: string,
    keyword: string,
    pageNum: number,
  ): string {
    const baseUrl = this.urlConfig.HH_MAIN_URL;
    const encodedKeyword = encodeURIComponent(keyword);
    const workFormat = this.settings.candidate.work_format ?? [];

    let url = `${baseUrl}/search/vacancy?text=${encodedKeyword}&area=${area}`;

    if (workFormat.length > 0) {
      url += `&work_format=${workFormat.join(',')}`;
    }

    if (pageNum > 0) {
      url += `&page=${pageNum}`;
    }

    return url;
  }

  private async getTotalPages(page: Page): Promise<number> {
    try {
      const paginationBlock = page.locator(
        this.elementConfig.HH_LIST_PAGINATION_BLOCK,
      );
      await paginationBlock.waitFor({ state: 'visible', timeout: 5000 });

      const totalPages2 = page.locator(
        this.elementConfig.HH_LIST_TOTAL_PAGES_2,
      );
      if (await totalPages2.count()) {
        const text = await totalPages2.textContent();
        const parsed = parseInt(text?.trim() ?? '', 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.logger.log(`[Crawler] Total pages (method 2): ${parsed}`);
          return parsed;
        }
      }

      const totalPages1 = page.locator(
        this.elementConfig.HH_LIST_TOTAL_PAGES_1,
      );
      if (await totalPages1.count()) {
        const text = await totalPages1.textContent();
        const parsed = parseInt(text?.trim() ?? '', 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.logger.log(`[Crawler] Total pages (method 1): ${parsed}`);
          return parsed;
        }
      }

      this.logger.warn(
        '[Crawler] Could not determine total pages, processing single page',
      );
      return 1;
    } catch {
      this.logger.warn(
        '[Crawler] Pagination block not found, processing single page',
      );
      return 1;
    }
  }

  private async processPage(
    page: Page,
    area: string,
    keyword: string,
    pageNum: number,
  ): Promise<void> {
    this.logger.log(
      `[Crawler] Processing page ${pageNum} (area: ${area}, keyword: "${keyword}")`,
    );

    const vacanciesList = page.locator(
      this.elementConfig.HH_LIST_VACANCIES_LIST,
    );
    const items = vacanciesList.locator(
      this.elementConfig.HH_LIST_VACANCY_ITEM,
    );
    const count = await items.count();

    this.logger.log(`[Crawler] Found ${count} vacancies on page ${pageNum}`);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await this.processVacancyItem(page, item);
    }
  }

  private async processVacancyItem(page: Page, item: Locator): Promise<void> {
    try {
      const vacancyId = await this.extractVacancyId(item);
      if (!vacancyId) {
        this.logger.warn('[Crawler] Could not extract vacancy ID, skipping');
        return;
      }

      this.logger.log(`[Crawler] Processing vacancy ID: ${vacancyId}`);

      const existing = await this.vacancyService.getVacancy(vacancyId);
      if (existing) {
        this.logger.log(
          `[Crawler] Vacancy ${vacancyId} already in DB, skipping`,
        );
        return;
      }

      if (await this.checkStopWordsOnItem(item)) {
        await this.vacancyService.addVacancy({ id: vacancyId });
        this.logger.log(
          `[Crawler] Vacancy ${vacancyId} filtered by stop words, saved to DB`,
        );
        return;
      }

      await item.click();
      await page.waitForLoadState('networkidle');

      const vacancyData = await this.extractVacancyDetails(page);
      if (!vacancyData) {
        this.logger.warn(
          `[Crawler] Could not extract details for vacancy ${vacancyId}`,
        );
        return;
      }

      const candidate = this.buildCandidate();
      const analysisResult = await this.llmService.analyzeVacancy(
        vacancyData.description,
        candidate,
      );

      if (analysisResult === 'NO') {
        await this.vacancyService.addVacancy({ id: vacancyId });
        this.logger.log(
          `[Crawler] Vacancy ${vacancyId} rejected by AI, saved to DB`,
        );
        return;
      }

      this.logger.log(
        `[Crawler] Vacancy ${vacancyId} approved by AI, proceeding to response`,
      );
      await this.handleResponseFlow(page, vacancyId, vacancyData, candidate);
    } catch (error) {
      this.logger.error(
        `[Crawler] Error processing vacancy item`,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private async extractVacancyId(item: Locator): Promise<number | null> {
    try {
      const link = item.locator(this.elementConfig.HH_LIST_VACANCY_LINK);
      const href = await link.getAttribute('href');
      if (!href) return null;

      const match = href.match(/\/vacancy\/(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    } catch {
      return null;
    }
  }

  private async checkStopWordsOnItem(item: Locator): Promise<boolean> {
    const titleEl = item.locator(this.elementConfig.HH_LIST_VACANCY_TITLE);
    const descEl = item.locator(
      this.elementConfig.HH_LIST_VACANCY_SNIPPET_DESCRIPTION,
    );
    const reqEl = item.locator(
      this.elementConfig.HH_LIST_VACANCY_SNIPPET_REQUIREMENTS,
    );

    const title = (await titleEl.textContent()) ?? '';
    if (this.filterService.checkStopWords(title)) return true;

    const description = (await descEl.textContent()) ?? '';
    if (this.filterService.checkStopWords(description)) return true;

    const requirements = (await reqEl.textContent()) ?? '';
    if (this.filterService.checkStopWords(requirements)) return true;

    return false;
  }

  private async extractVacancyDetails(page: Page): Promise<Vacancy | null> {
    try {
      const companyName =
        (
          await page
            .locator(this.elementConfig.HH_DETAILED_COMPANY_NAME)
            .textContent()
        )?.trim() ?? '';
      const title =
        (
          await page
            .locator(this.elementConfig.HH_DETAILED_VACANCY_TITLE)
            .textContent()
        )?.trim() ?? '';
      const salary =
        (
          await page
            .locator(this.elementConfig.HH_DETAILED_SALARY)
            .textContent()
        )?.trim() ?? '';
      const workFormat =
        (
          await page
            .locator(this.elementConfig.HH_DETAILED_WORK_FORMAT)
            .textContent()
        )?.trim() ?? '';
      const description =
        (
          await page
            .locator(this.elementConfig.HH_DETAILED_VACANCY_DESCRIPTION)
            .textContent()
        )?.trim() ?? '';

      return {
        id: '',
        title,
        company: companyName,
        description,
        url: page.url(),
        salary: salary || undefined,
        location: workFormat || undefined,
      };
    } catch (error) {
      this.logger.error(
        '[Crawler] Failed to extract vacancy details',
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  private buildCandidate(): Candidate {
    const candidateSettings = this.settings.candidate;
    return {
      name: candidateSettings.name,
      desired_positions: candidateSettings.desired_positions,
      salary_expectation: candidateSettings.salary_expectation,
      work_format: candidateSettings.work_format,
      experience_summary: candidateSettings.experience_summary,
      projects: candidateSettings.projects,
    };
  }

  private async handleResponseFlow(
    page: Page,
    vacancyId: number,
    vacancyData: Vacancy,
    candidate: Candidate,
  ): Promise<void> {
    let additionalInstructions = '';
    let finished = false;
    let messageId: number | null = null;
    let hasQuestionnaire = false;

    while (!finished) {
      const coverLetter = await this.llmService.generateCoverLetter(
        vacancyData,
        candidate,
        additionalInstructions,
      );

      const additionalForm = page.locator(
        this.elementConfig.HH_IS_ADDITIONAL_FORM,
      );
      hasQuestionnaire = (await additionalForm.count()) > 0;

      const cardData = {
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
          this.telegramConfig.CHAT_ID,
          cardData,
        );
      } else {
        await this.telegramNotify.updateVacancyCard(
          this.telegramConfig.CHAT_ID,
          messageId,
          cardData,
        );
      }

      this.logger.log(
        `[Crawler] Sent vacancy card to Telegram for vacancy ${vacancyId}`,
      );

      let action: {
        type: 'SEND' | 'REJECT' | 'EDIT';
        vacancyId: number | null;
      };
      try {
        action = await this.telegramWait.waitForAction(
          this.telegramConfig.CHAT_ID,
        );
      } catch (error) {
        this.logger.error(
          `[Crawler] Telegram wait timeout for vacancy ${vacancyId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
        await this.vacancyService.addVacancy({ id: vacancyId });
        finished = true;
        break;
      }

      switch (action.type) {
        case 'REJECT': {
          await this.vacancyService.addVacancy({ id: vacancyId });
          this.logger.log(
            `[Crawler] Vacancy ${vacancyId} rejected by user, saved to DB`,
          );
          finished = true;
          break;
        }
        case 'EDIT': {
          try {
            const instructions = await this.telegramWait.waitForText(
              this.telegramConfig.CHAT_ID,
            );
            additionalInstructions = instructions;
            this.logger.log(
              `[Crawler] Received edit instructions for vacancy ${vacancyId}`,
            );
          } catch (error) {
            this.logger.error(
              `[Crawler] Failed to get edit instructions for vacancy ${vacancyId}`,
              error instanceof Error ? error : new Error(String(error)),
            );
            finished = true;
          }
          break;
        }
        case 'SEND': {
          this.logger.log(
            `[Crawler] User approved sending response for vacancy ${vacancyId}`,
          );
          await this.submitResponse(page, vacancyId, coverLetter);
          await this.vacancyService.addVacancy({ id: vacancyId });
          finished = true;
          break;
        }
      }
    }

    if (hasQuestionnaire) {
      this.logger.log(
        `[Crawler] Vacancy ${vacancyId} has questionnaire, waiting for manual completion`,
      );
    }
  }

  private async submitResponse(
    page: Page,
    vacancyId: number,
    coverLetter: string,
  ): Promise<void> {
    const responseUrl = `${this.urlConfig.HH_MAIN_URL}/applicant/vacancy_response?vacancyId=${vacancyId}`;
    await page.goto(responseUrl, { waitUntil: 'networkidle' });

    const resumeDropdown = page.locator(
      this.elementConfig.HH_RESUME_DROPDOWN_SELECTOR,
    );
    const currentResume = (await resumeDropdown.textContent())?.trim() ?? '';
    const targetResume = this.settings.hh.resume_name;

    if (currentResume !== targetResume) {
      this.logger.log(
        `[Crawler] Resume mismatch: current="${currentResume}", target="${targetResume}"`,
      );
      await resumeDropdown.click();

      const dropdownList = page.locator(
        this.elementConfig.HH_RESUME_DROPDOWN_LIST,
      );
      const options = dropdownList.locator(
        this.elementConfig.HH_RESUME_DROPDOWN_NAME,
      );
      const optionCount = await options.count();

      let found = false;
      for (let i = 0; i < optionCount; i++) {
        const option = options.nth(i);
        const text = (await option.textContent())?.trim() ?? '';
        if (text === targetResume) {
          await option.click();
          found = true;
          this.logger.log(`[Crawler] Selected resume: ${targetResume}`);
          break;
        }
      }

      if (!found) {
        this.logger.error(
          `[Crawler] Resume "${targetResume}" not found in dropdown`,
          new Error('Resume not found'),
        );
        process.exit(1);
      }
    }

    const textarea = page.locator(this.elementConfig.HH_APPLY_FORM_TEXTAREA);
    await textarea.fill(coverLetter);

    // const submitButton = page.locator(
    //   this.elementConfig.HH_APPLY_FORM_SUBMIT_BUTTON,
    // );
    // await submitButton.click();

    await page.waitForLoadState('networkidle');
    this.logger.log(`[Crawler] Response submitted for vacancy ${vacancyId}`);
  }
}
