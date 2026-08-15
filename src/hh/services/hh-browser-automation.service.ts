import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Browser, BrowserContext, Page } from 'playwright';
import hhElementsConfig from '../../config/hh.elements.config';
import hhUrlConfig from '../../config/hh.url.config';
import mainConfig from '../../config/main.config';
import { LLMService } from '../../llm/llm.service';
import { LoggerService } from '../../logger/logger.service';
import { SessionService } from './session.service';

@Injectable()
export class HhBrowserAutomationService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(
    @Inject(hhUrlConfig.KEY)
    private readonly urlConfig: ConfigType<typeof hhUrlConfig>,
    @Inject(mainConfig.KEY)
    private readonly appConfig: ConfigType<typeof mainConfig>,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly logger: LoggerService,
    private readonly sessionService: SessionService,
    private readonly llmService: LLMService,
  ) {}

  async login(): Promise<void> {
    this.browser = await this.getOrCreateBrowser();

    if (await this.sessionService.hasSession()) {
      this.logger.log('[Session] Session found, trying to restore...');

      const storageState = await this.sessionService.readSession();
      this.context = await this.browser.newContext({
        storageState: storageState ?? undefined,
      });
      const page = await this.context.newPage();
      await page.goto(this.urlConfig.HH_MAIN_URL);

      if (await this.isLoggedIn(page)) {
        this.logger.log('[Session] Session is valid, login is not required');
        return;
      }

      this.logger.log(
        '[Session] Session expired, falling back to manual login...',
      );
      await this.context.close();
      await this.sessionService.clearSession();
    }

    await this.performManualLogin();
  }

  private async performManualLogin(): Promise<void> {
    while (true) {
      const context = await this.browser!.newContext();
      const page = await context.newPage();
      await page.goto(this.urlConfig.HH_MAIN_URL);

      this.logger.log(
        'Нажмите ENTER после того, как залогинитесь в браузере...',
      );
      await new Promise<void>((resolve) =>
        process.stdin.once('data', () => resolve()),
      );

      const isLoggedIn = await this.isLoggedIn(page);
      if (isLoggedIn) {
        const storageState = await context.storageState();
        await this.sessionService.writeSession(storageState);
        this.context = context;
        this.logger.log('Авторизация прошла успешно');
        return;
      }

      this.logger.error(
        'Не удалось авторизоваться. Сессия не создана.',
        new Error('login failed'),
        { action: 'retry_login' },
      );
      await context.close();

      this.logger.log('Попробуем еще раз...');
    }
  }

  private async isLoggedIn(page: Page): Promise<boolean> {
    const loginUrl = page.url();
    if (loginUrl.includes('/account/login') || loginUrl.includes('/login')) {
      return false;
    }

    const accountPanel = page.locator(
      `${this.elementConfig.HH_PROFILE_ICON_DESKTOP},
      ${this.elementConfig.HH_PROFILE_ICON_MOBILE}`,
    );

    return (await accountPanel.count()) > 0;
  }

  private async getOrCreateBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) return this.browser;

    const { launch } = await import('cloakbrowser');

    const headlessMode = this.appConfig.HH_HEADLESS;

    this.browser = await launch({
      headless: headlessMode,
      args: ['--disable-blink-features=AutomationControlled'],
    });

    return this.browser;
  }

  getContext(): BrowserContext {
    if (!this.context) {
      throw new Error('Context not initialized. Call login() first.');
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

  async close(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
    this.browser = null;
    this.context = null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
