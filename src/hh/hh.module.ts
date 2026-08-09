import { Module } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { ControlService } from './services/control.service';
import { EntryService } from './services/entry.service';
import { HhBrowserAutomationServiceTsService } from './services/hh-browser-automation.service';
import { SessionService } from './services/session.service';

@Module({
  providers: [
    EntryService,
    LoggerService,
    HhBrowserAutomationServiceTsService,
    SessionService,
    ControlService,
  ],
})
export class HhModule {}
