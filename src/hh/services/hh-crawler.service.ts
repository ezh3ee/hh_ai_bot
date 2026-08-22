import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Locator, Page } from 'playwright';
import hhConfig, { type HhConfig } from '../../config/hh.config';
import hhElementsConfig from '../../config/hh.elements.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LLMService } from '../../llm/llm.service';
import { Candidate, Vacancy } from '../../llm/llm.types';
import { LoggerService } from '../../logger/logger.service';
import { VacancyService } from '../../vacancy/vacancy.service';
import { HhApplyService } from './hh-apply.service';
import { HhBrowserService } from './hh-browser.service';
import { HhPageNavigatorService } from './hh-page-navigator.service';
import { HhUserInteractionService } from './hh-user-interaction.service';

@Injectable()
export class HhCrawlerService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly hhConfig: HhConfig,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly settings: SettingsConfigService,
    private readonly browserService: HhBrowserService,
    private readonly vacancyService: VacancyService,
    private readonly llmService: LLMService,
    private readonly pageNavigator: HhPageNavigatorService,
    private readonly applyService: HhApplyService,
    private readonly userInteraction: HhUserInteractionService,
    private readonly logger: LoggerService,
  ) {}

  async crawl(): Promise<void> {
    this.validateSettings();
    this.logger.log('[Crawler] Starting vacancy search...');

    const areas = this.settings.hh.areas;
    const searchQueries = this.settings.hh.search_queries;

    for (const area of areas) {
      await this.pageNavigator.processArea(area, searchQueries, (page, item) =>
        this.processVacancyItem(page, item),
      );
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

  private async processVacancyItem(page: Page, item: Locator): Promise<void> {
    const vacancyId = await this.pageNavigator.extractVacancyId(item);
    if (!vacancyId) {
      this.logger.warn('[Crawler] Could not extract vacancy ID, skipping');
      return;
    }

    this.logger.log(`[Crawler] Processing vacancy ID: ${vacancyId}`);

    const existing = await this.vacancyService.getVacancy(vacancyId);
    if (existing) {
      this.logger.log(`[Crawler] Vacancy ${vacancyId} already in DB, skipping`);
      return;
    }

    if (await this.pageNavigator.checkStopWordsOnItem(item)) {
      await this.vacancyService.addVacancy({ id: vacancyId });
      this.logger.log(
        `[Crawler] Vacancy ${vacancyId} filtered by stop words, saved to DB`,
      );
      return;
    }

    this.logger.log(`[Crawler] Vacancy ${vacancyId} PASSED stop words filter.`);

    let detailedPage: Page | null = null;
    try {
      await item.click();
      await new Promise((resolve) =>
        setTimeout(resolve, this.hhConfig.HH_PAGE_LOAD_DELAY_MS),
      );
      detailedPage = await this.browserService.getLastPage();
      await detailedPage.waitForLoadState('domcontentloaded');

      const vacancyData = await this.extractVacancyDetails(
        detailedPage,
        vacancyId,
      );
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
      const result = await this.userInteraction.handleResponseFlow(
        detailedPage,
        vacancyData,
        candidate,
      );
      if (result.action === 'SEND') {
        await this.applyService.submitResponse(
          detailedPage,
          result.coverLetter,
        );
      }
    } catch (error) {
      this.logger.error(
        `[Crawler] Error processing vacancy item`,
        error instanceof Error ? error : new Error(String(error)),
      );
    } finally {
      if (detailedPage) {
        await detailedPage.close();
      }
    }
  }

  private async extractVacancyDetails(
    page: Page,
    vacancyId: number,
  ): Promise<Vacancy | null> {
    try {
      const companyName = await this.safeGetText(
        page,
        this.elementConfig.HH_DETAILED_COMPANY_NAME,
      );

      const title = await this.safeGetText(
        page,
        this.elementConfig.HH_DETAILED_VACANCY_TITLE,
      );

      const salary = await this.safeGetText(
        page,
        this.elementConfig.HH_DETAILED_SALARY,
      );

      const workFormat = await this.safeGetText(
        page,
        this.elementConfig.HH_DETAILED_WORK_FORMAT,
      );

      const description = await this.safeGetText(
        page,
        this.elementConfig.HH_DETAILED_VACANCY_DESCRIPTION,
      );

      return {
        id: String(vacancyId),
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

  private async safeGetText(page: Page, selector: string): Promise<string> {
    try {
      return (
        (
          await page.locator(selector).textContent({
            timeout: this.hhConfig.HH_SAFE_GET_TEXT_TIMEOUT_MS,
          })
        )?.trim() ?? ''
      );
    } catch {
      this.logger.warn(`[Crawler] Failed to extract selector ${selector}`, {
        action: 'safeGetText',
        selector,
      });
      return '';
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
}
