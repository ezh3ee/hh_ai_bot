import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { LoggerService } from '../logger/logger.service';
import { ControlService } from './services/control.service';
import { EntryService } from './services/entry.service';
import { HhBrowserAutomationService } from './services/hh-browser-automation.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [LlmModule],
  providers: [
    EntryService,
    LoggerService,
    HhBrowserAutomationService,
    SessionService,
    ControlService,
  ],
})
export class HhModule {}
