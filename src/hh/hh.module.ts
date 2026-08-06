import { Module } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { ControlService } from './services/control.service';
import { EntryService } from './services/entry.service';
import { HhBrowserAutomationServiceTsService } from './services/hh-browser-automation.service.ts.service';

@Module({
  providers: [
    EntryService,
    LoggerService,
    HhBrowserAutomationServiceTsService,
    ControlService,
  ],
})
export class HhModule {}
