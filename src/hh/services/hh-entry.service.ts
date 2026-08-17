import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { LoginResult } from '../hh.types';
import { HhFlowService } from './hh-flow.service';

@Injectable()
export class HhEntryService implements OnApplicationBootstrap {
  constructor(
    private readonly flowService: HhFlowService,
    private readonly logger: LoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('Starting HH application...');

    const result: LoginResult = await this.flowService.login();

    if (result.success) {
      this.logger.log(
        `Login successful: ${result.message} (mode: ${result.mode})`,
      );
    } else {
      this.logger.error(
        'Login failed',
        new Error(result.message ?? 'Unknown error'),
      );
      process.exit(1);
    }
  }
}
