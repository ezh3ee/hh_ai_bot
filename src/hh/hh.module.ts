import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LlmModule } from '../llm/llm.module';
import { LoggerModule } from '../logger/logger.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { VacancyService } from '../vacancy/vacancy.service';
import { HhApplyService } from './services/hh-apply.service';
import { HhAuthService } from './services/hh-auth.service';
import { HhBrowserService } from './services/hh-browser.service';
import { HhCrawlerService } from './services/hh-crawler.service';
import { HhEntryService } from './services/hh-entry.service';
import { HhFlowService } from './services/hh-flow.service';
import { HhPageNavigatorService } from './services/hh-page-navigator.service';
import { HhUserInteractionService } from './services/hh-user-interaction.service';
import { HhSessionService } from './services/hh.session.service';
import { VacancyFilterService } from './services/vacancy-filter.service';

@Module({
  imports: [LlmModule, PrismaModule, TelegramModule, LoggerModule],
  providers: [
    HhEntryService,
    HhFlowService,
    HhAuthService,
    HhBrowserService,
    HhSessionService,
    HhCrawlerService,
    HhPageNavigatorService,
    HhApplyService,
    HhUserInteractionService,
    VacancyFilterService,
    VacancyService,
    SettingsConfigService,
  ],
})
export class HhModule {}
