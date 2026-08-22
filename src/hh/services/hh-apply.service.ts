import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Page } from 'playwright';
import hhConfig, { type HhConfig } from '../../config/hh.config';
import hhElementsConfig from '../../config/hh.elements.config';
import mainConfig from '../../config/main.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class HhApplyService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly hhConfig: HhConfig,
    @Inject(mainConfig.KEY)
    private readonly appConfig: ConfigType<typeof mainConfig>,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly settings: SettingsConfigService,
    private readonly logger: LoggerService,
  ) {}

  async submitResponse(page: Page, coverLetter: string): Promise<void> {
    await this.ensureCorrectResume(page);
    await this.fillTextarea(page, coverLetter);
    await this.submit(page);

    await page.waitForLoadState('domcontentloaded');
    this.logger.log(`[Apply] Response submitted`);
  }

  private async ensureCorrectResume(page: Page): Promise<void> {
    const resumeDropdown = page
      .locator(this.elementConfig.HH_RESUME_DROPDOWN_SELECTOR)
      .first();
    const currentResume = (await resumeDropdown.textContent())?.trim() ?? '';
    const targetResume = this.settings.hh.resume_name;

    if (currentResume !== targetResume) {
      this.logger.log(
        `[Apply] Resume mismatch: current="${currentResume}", target="${targetResume}"`,
      );
      await resumeDropdown.click();
      await new Promise((resolve) =>
        setTimeout(resolve, this.hhConfig.HH_DROPDOWN_DELAY_MS),
      );

      const resumes = page.locator(this.elementConfig.HH_RESUME_DROPDOWN_NAME);
      const resumesCount = await resumes.count();

      let found = false;
      for (let i = 0; i < resumesCount; i++) {
        const resume = resumes.nth(i);
        const text = (await resume.textContent())?.trim() ?? '';
        if (text === targetResume) {
          await resume.click();
          found = true;
          this.logger.log(`[Apply] Selected resume: ${targetResume}`);
          break;
        }
      }

      if (!found) {
        this.logger.error(
          `[Apply] Resume "${targetResume}" not found in dropdown`,
          new Error('Resume not found'),
        );
        process.exit(1);
      }
    }
  }

  private async fillTextarea(page: Page, coverLetter: string): Promise<void> {
    try {
      const coverLetterTrigger = page.locator(
        this.elementConfig.HH_APPLY_FORM_COVER_LETTER_TRIGGER,
      );

      await coverLetterTrigger.click();
    } catch {
      this.logger.warn(`[Apply] Cover letter trigger not found`, {
        action: 'coverLetterTrigger',
        selector: this.elementConfig.HH_APPLY_FORM_COVER_LETTER_TRIGGER,
      });
    }

    const textarea = page.locator(this.elementConfig.HH_APPLY_FORM_TEXTAREA);
    await textarea.fill(coverLetter);
  }

  private async submit(page: Page): Promise<void> {
    if (!this.appConfig.TEST_MODE) {
      const submitButton = page.locator(
        this.elementConfig.HH_APPLY_FORM_SUBMIT_BUTTON,
      );

      await submitButton.click();
    }
  }
}
