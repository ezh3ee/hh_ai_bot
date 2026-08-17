import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Browser, BrowserContext, Page } from 'playwright';
import mainConfig from '../../config/main.config';
import { LoggerService } from '../../logger/logger.service';
import { StorageState } from './hh.session.service';

@Injectable()
export class HhBrowserService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(
    @Inject(mainConfig.KEY)
    private readonly appConfig: ConfigType<typeof mainConfig>,
    private readonly logger: LoggerService,
  ) {}

  async getOrCreateBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    const { launch } = await import('cloakbrowser');

    const headlessMode = this.appConfig.HH_HEADLESS;

    this.browser = await launch({
      headless: headlessMode,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    this.logger.log('Browser launched');
    return this.browser;
  }

  async createContext(storageState?: StorageState): Promise<BrowserContext> {
    const browser = await this.getOrCreateBrowser();

    this.context = await browser.newContext({
      storageState: storageState ?? undefined,
    });

    this.logger.log('Browser context created');
    return this.context;
  }

  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error('Context not initialized. Call createContext() first.');
    }
    return this.context;
  }

  async newPage(): Promise<Page> {
    return this.getContext().newPage();
  }

  async getPage(): Promise<Page> {
    const pages = this.getContext().pages();
    return pages[0] ?? (await this.newPage());
  }

  async closeContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.logger.log('Browser context closed');
    }
  }

  async close(): Promise<void> {
    await this.closeContext();
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }

  isConnected(): boolean {
    return this.browser !== null && this.browser.isConnected();
  }

  hasContext(): boolean {
    return this.context !== null;
  }
}
