import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { LoginResult } from '../hh.types';
import { HhAuthService } from './hh-auth.service';

@Injectable()
export class HhFlowService {
  constructor(
    private readonly authService: HhAuthService,
    private readonly logger: LoggerService,
  ) {}

  async login(): Promise<LoginResult> {
    this.logger.log('Starting HH login flow...');

    const sessionRestored = await this.authService.restoreSession();

    if (sessionRestored) {
      this.logger.log('Login flow completed: session restored');
      return {
        success: true,
        mode: 'restored',
        message: 'Session restored from saved cookies',
      };
    }

    this.logger.log('Starting manual login...');
    await this.authService.performManualLogin();

    this.logger.log('Login flow completed: manual login successful');
    return {
      success: true,
      mode: 'manual',
      message: 'Manual login completed, session saved',
    };
  }
}
