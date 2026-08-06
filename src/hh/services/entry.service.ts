import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';
import { ControlService } from './control.service';

@Injectable()
export class EntryService implements OnApplicationBootstrap {
  constructor(
    private readonly logger: LoggerService,
    private readonly controlService: ControlService,
  ) {}
  async onApplicationBootstrap() {
    this.logger.log('Starting the app...');
    await this.controlService.initAndRun();
  }
}
