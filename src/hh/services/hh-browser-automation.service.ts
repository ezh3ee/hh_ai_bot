import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Browser } from 'playwright';
import hhUrlConfig from 'src/config/hh.url.config';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class HhBrowserAutomationServiceTsService {
  private browser: Browser | null = null;

  constructor(
    @Inject(hhUrlConfig.KEY)
    private readonly config: ConfigType<typeof hhUrlConfig>,
    private readonly logger: LoggerService,
  ) {}

  async login() {
    const browser = await this.getOrCreateBrowser();

    console.log('from config ', this.config.HH_MAIN_URL);

    const page = await browser.newPage();
    await page.goto(this.config.HH_MAIN_URL);

    // Ждем нажатия Enter от пользователя
    this.logger.log('Нажмите Enter как залогинитесь');
    await new Promise<void>((resolve) =>
      process.stdin.once('data', () => resolve()),
    );

    this.logger.log('Enter нажат');
    await this.browser?.close();
    this.logger.log('Скрипт отработал');
  }

  private async getOrCreateBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) return this.browser;

    // const { chromium } = await import('playwright');
    const { launch } = await import('cloakbrowser');

    // this.browser = await chromium.launch({
    //   headless: false,
    //   args: ['--disable-blink-features=AutomationControlled'],
    // });

    this.browser = await launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    return this.browser;
  }
}
