import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { LoggerService } from '../logger/logger.service';
import { HhAuthService } from './services/hh-auth.service';
import { HhBrowserService } from './services/hh-browser.service';
import { HhEntryService } from './services/hh-entry.service';
import { HhFlowService } from './services/hh-flow.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [LlmModule],
  providers: [
    HhEntryService,
    HhFlowService,
    HhAuthService,
    HhBrowserService,
    SessionService,
    LoggerService,
  ],
})
export class HhModule {}
