import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { HhBrowserAutomationService } from './hh-browser-automation.service';

@Injectable()
export class ControlService {
  constructor(
    private readonly logger: LoggerService,
    private readonly browserAutomationService: HhBrowserAutomationService,
  ) {}

  async initAndRun() {
    this.logger.log('...Running initAndRun method in ControlService...');

    await this.browserAutomationService.login();
  }
}
