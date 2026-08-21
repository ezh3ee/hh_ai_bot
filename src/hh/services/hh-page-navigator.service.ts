import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Locator, Page } from 'playwright';
import hhElementsConfig from '../../config/hh.elements.config';
import hhConfig, { type HhConfig } from '../../config/hh.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';
import { HhBrowserService } from './hh-browser.service';
import { VacancyFilterService } from './vacancy-filter.service';

@Injectable()
export class HhPageNavigatorService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly hhConfig: HhConfig,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly settings: SettingsConfigService,
    private readonly browserService: HhBrowserService,
    private readonly filterService: VacancyFilterService,
    private readonly logger: LoggerService,
  ) {}

  async processArea(
    area: string,
    searchQueries: string[],
    processVacancyItem: (page: Page, item: Locator) => Promise<void>,
  ): Promise<void> {
    this.logger.log(`[Navigator] Processing area: ${area}`);

    for (const keyword of searchQueries) {
      await this.processKeyword(area, keyword, processVacancyItem);
    }
  }

  private async processKeyword(
    area: string,
    keyword: string,
    processVacancyItem: (page: Page, item: Locator) => Promise<void>,
  ): Promise<void> {
    this.logger.log(
      `[Navigator] Processing keyword: "${keyword}" in area: ${area}`,
    );

    const firstPageUrl = this.buildSearchUrl(area, keyword, 0);
    const page = await this.browserService.newPage();

    try {
      await page.goto(firstPageUrl, { waitUntil: 'domcontentloaded' });
      const totalPages = await this.getTotalPages(page);
      this.logger.log(`[Navigator] Total pages: ${totalPages}`);

      for (let pageNum = 0; pageNum < totalPages; pageNum++) {
        if (pageNum > 0) {
          const pageUrl = this.buildSearchUrl(area, keyword, pageNum);
          await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
        }
        await this.processPage(
          page,
          area,
          keyword,
          pageNum,
          processVacancyItem,
        );
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
    const baseUrl = this.hhConfig.HH_MAIN_URL;
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
      await paginationBlock.waitFor({
        state: 'visible',
        timeout: this.hhConfig.HH_PAGINATION_TIMEOUT_MS,
      });

      const totalPages2 = page.locator(
        this.elementConfig.HH_LIST_TOTAL_PAGES_2,
      );
      if (await totalPages2.count()) {
        const text = await totalPages2.textContent();
        const parsed = parseInt(text?.trim() ?? '', 10);
        if (!isNaN(parsed) && parsed > 0) {
          this.logger.log(`[Navigator] Total pages (method 2): ${parsed}`);
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
          this.logger.log(`[Navigator] Total pages (method 1): ${parsed}`);
          return parsed;
        }
      }

      this.logger.warn(
        '[Navigator] Could not determine total pages, processing single page',
      );
      return 1;
    } catch {
      this.logger.warn(
        '[Navigator] Pagination block not found, processing single page',
      );
      return 1;
    }
  }

  private async processPage(
    page: Page,
    area: string,
    keyword: string,
    pageNum: number,
    processVacancyItem: (page: Page, item: Locator) => Promise<void>,
  ): Promise<void> {
    this.logger.log(
      `[Navigator] Processing page ${pageNum} (area: ${area}, keyword: "${keyword}")`,
    );

    const vacanciesList = page.locator(
      this.elementConfig.HH_LIST_VACANCIES_LIST,
    );
    const items = vacanciesList.locator(
      this.elementConfig.HH_LIST_VACANCY_ITEM,
    );
    const count = await items.count();

    this.logger.log(`[Navigator] Found ${count} vacancies on page ${pageNum}`);

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await processVacancyItem(page, item);
    }
  }

  async extractVacancyId(item: Locator): Promise<number | null> {
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

  async checkStopWordsOnItem(item: Locator): Promise<boolean> {
    const titleEl = item.locator(this.elementConfig.HH_LIST_VACANCY_TITLE);
    const descEl = item.locator(
      this.elementConfig.HH_LIST_VACANCY_SNIPPET_DESCRIPTION,
    );
    const reqEl = item.locator(
      this.elementConfig.HH_LIST_VACANCY_SNIPPET_REQUIREMENTS,
    );

    const title = (await titleEl.textContent()) ?? '';
    if (this.filterService.checkStopWords(title)) return true;

    try {
      const description = (await descEl.textContent()) ?? '';
      if (this.filterService.checkStopWords(description)) return true;
    } catch {
      const description = (await descEl.allTextContents()) ?? [];
      for (const text of description) {
        if (this.filterService.checkStopWords(text)) return true;
      }
    }

    try {
      const requirements = (await reqEl.textContent()) ?? '';
      if (this.filterService.checkStopWords(requirements)) return true;
    } catch {
      const requirements = (await reqEl.allTextContents()) ?? [];
      for (const text of requirements) {
        if (this.filterService.checkStopWords(text)) return true;
      }
    }

    return false;
  }
}
