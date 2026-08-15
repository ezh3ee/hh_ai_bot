import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LLMService } from '../llm/llm.service';
import { LoggerService } from '../logger/logger.service';
import { ControlService } from './services/control.service';
import { EntryService } from './services/entry.service';
import { HhBrowserAutomationService } from './services/hh-browser-automation.service';
import { SessionService } from './services/session.service';

@Module({
  providers: [
    EntryService,
    LoggerService,
    HhBrowserAutomationService,
    SessionService,
    ControlService,
    LLMService, //
    SettingsConfigService,
  ],
})
export class HhModule {}
