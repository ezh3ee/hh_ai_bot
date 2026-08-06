import { Injectable } from '@nestjs/common';
import { PlaywrightCrawler } from 'crawlee';

@Injectable()
export class HhBrowserAutomationServiceTsService {
  async login() {
    const crawler = new PlaywrightCrawler({
      async requestHandler({ page, request, log }) {
        log.info(`Crawling ${request.url}`);

        const title = await page.title();
        log.info(`Page title: ${title}`);
      },

      headless: false,
    });

    await crawler.run(['https://hh.com']);
  }
}
