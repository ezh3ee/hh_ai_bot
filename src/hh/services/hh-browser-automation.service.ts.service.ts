import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class HhBrowserAutomationServiceTsService {
  constructor(private readonly logger: LoggerService) {}

  async login() {
    const crawler = new PlaywrightCrawler({
      async requestHandler({ page, request, log }) {
        log.info(`Crawling ${request.url}`);

        const title = await page.title();
        log.info(`Page title: ${title}`);
      },

      headless: false,
    });
    this.logger.log('Start crawling');
    await crawler.run(['https://hh.ru']);
  }
}
