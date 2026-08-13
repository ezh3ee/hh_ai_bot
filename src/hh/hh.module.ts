import { Module } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ControlService } from './services/control.service';
import { EntryService } from './services/entry.service';
import { HhBrowserAutomationService } from './services/hh-browser-automation.service';
import { SessionService } from './services/session.service';

@Module({
  imports: [PrismaModule],
  providers: [
    EntryService,
    LoggerService,
    HhBrowserAutomationService,
    SessionService,
    ControlService,
  ],
})
export class HhModule {}
