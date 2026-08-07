import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { HhBrowserAutomationServiceTsService } from './hh-browser-automation.service';

@Injectable()
export class ControlService {
  constructor(
    private readonly logger: LoggerService,
    private readonly browserAutomationService: HhBrowserAutomationServiceTsService,
  ) {}
  login() {
    this.logger.log('...Running login method in ControlService...');
  }

  async initAndRun() {
    this.logger.log('...Running initAndRun method in ControlService...');

    await this.browserAutomationService.login();
  }
}
