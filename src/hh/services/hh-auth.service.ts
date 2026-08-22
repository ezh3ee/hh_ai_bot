import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Page } from 'playwright';
import hhElementsConfig from '../../config/hh.elements.config';
import hhConfig from '../../config/hh.config';
import { LoggerService } from '../../logger/logger.service';
import { HhBrowserService } from './hh-browser.service';
import { HhSessionService } from './hh.session.service';

@Injectable()
export class HhAuthService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly urlConfig: ConfigType<typeof hhConfig>,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly sessionService: HhSessionService,
    private readonly browserService: HhBrowserService,
    private readonly logger: LoggerService,
  ) {}

  async isLoggedIn(page: Page): Promise<boolean> {
    const loginUrl = page.url();
    if (loginUrl.includes('/account/login') || loginUrl.includes('/login')) {
      return false;
    }

    const accountPanel = page.locator(
      `${this.elementConfig.HH_PROFILE_ICON_DESKTOP}, ${this.elementConfig.HH_PROFILE_ICON_MOBILE}`,
    );

    return (await accountPanel.count()) > 0;
  }

  async restoreSession(): Promise<boolean> {
    if (!(await this.sessionService.hasSession())) {
      this.logger.log('[Session] No session found');
      return false;
    }

    this.logger.log('[Session] Session found, trying to restore...');

    const storageState = await this.sessionService.readSession();
    await this.browserService.createContext(storageState ?? undefined);
    const page = await this.browserService.newPage();
    await page.goto(this.urlConfig.HH_MAIN_URL);

    if (await this.isLoggedIn(page)) {
      this.logger.log('[Session] Session is valid, login is not required');
      return true;
    }

    this.logger.log('[Session] Session expired, will do manual login...');
    await this.browserService.closeContext();
    await this.sessionService.clearSession();
    return false;
  }

  async performManualLogin(): Promise<void> {
    while (true) {
      await this.browserService.createContext();
      const page = await this.browserService.newPage();
      await page.goto(this.urlConfig.HH_MAIN_URL);

      this.logger.log(
        'Нажмите ENTER после того, как залогинитесь в браузере...',
      );
      await new Promise<void>((resolve) =>
        process.stdin.once('data', () => resolve()),
      );

      if (await this.isLoggedIn(page)) {
        await this.saveSession();
        this.logger.log('Авторизация прошла успешно');
        return;
      }

      this.logger.error(
        'Не удалось авторизоваться. Сессия не создана.',
        new Error('login failed'),
        { action: 'retry_login' },
      );
      await this.browserService.closeContext();

      this.logger.log('Попробуем еще раз...');
    }
  }

  async saveSession(): Promise<void> {
    const storageState = await this.browserService.getContext().storageState();
    await this.sessionService.writeSession(storageState);
    this.logger.log('Session saved');
  }
}
