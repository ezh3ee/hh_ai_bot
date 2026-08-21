import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Page } from 'playwright';
import hhElementsConfig from '../../config/hh.elements.config';
import hhConfig, { type HhConfig } from '../../config/hh.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class HhApplyService {
  constructor(
    @Inject(hhConfig.KEY)
    private readonly hhConfig: HhConfig,
    @Inject(hhElementsConfig.KEY)
    private readonly elementConfig: ConfigType<typeof hhElementsConfig>,
    private readonly settings: SettingsConfigService,
    private readonly logger: LoggerService,
  ) {}

  async submitResponse(page: Page, coverLetter: string): Promise<void> {
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

    const submitButton = page.locator(
      this.elementConfig.HH_APPLY_FORM_SUBMIT_BUTTON,
    );
    await submitButton.click();

    await page.waitForLoadState('domcontentloaded');
    this.logger.log(`[Apply] Response submitted`);
  }

  async openResponsePage(page: Page): Promise<void> {
    const vacancyId = page.url().match(/\/vacancy\/(\d+)/)?.[1];
    if (!vacancyId) {
      this.logger.error(
        '[Apply] Could not extract vacancyId from URL',
        new Error('vacancyId not found in URL'),
      );
      return;
    }
    const responseUrl = `${this.hhConfig.HH_MAIN_URL}/applicant/vacancy_response?vacancyId=${vacancyId}`;
    await page.goto(responseUrl, { waitUntil: 'domcontentloaded' });
  }
}
