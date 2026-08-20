import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { LoggerService } from '../logger/logger.service';
import { TelegramNotifyService } from '../telegram/services/telegram-notify.service';
import { TelegramWaitService } from '../telegram/services/telegram-wait.service';
import { VacancyService } from '../vacancy/vacancy.service';
import { HhAuthService } from './services/hh-auth.service';
import { HhBrowserService } from './services/hh-browser.service';
import { HhCrawlerService } from './services/hh-crawler.service';
import { HhEntryService } from './services/hh-entry.service';
import { HhFlowService } from './services/hh-flow.service';
import { HhSessionService } from './services/hh.session.service';
import { VacancyFilterService } from './services/vacancy-filter.service';

@Module({
  imports: [LlmModule],
  providers: [
    HhEntryService,
    HhFlowService,
    HhAuthService,
    HhBrowserService,
    HhSessionService,
    HhCrawlerService,
    VacancyFilterService,
    LoggerService,
    TelegramNotifyService,
    TelegramWaitService,
    VacancyService,
  ],
})
export class HhModule {}
