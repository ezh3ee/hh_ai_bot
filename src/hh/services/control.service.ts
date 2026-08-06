import { Injectable } from '@nestjs/common';
import { LoggerService } from 'src/logger/logger.service';

@Injectable()
export class ControlService {
  constructor(private readonly logger: LoggerService) {}
  login() {
    this.logger.log('...Running login method in ControlService...');
  }

  initAndRun() {
    this.logger.log('...Running initAndRun method in ControlService...');
  }
}
