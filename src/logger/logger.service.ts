import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class LoggerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoggerService.name);

  onApplicationBootstrap() {
    this.logger.log('The application graph is fully initialized.');
  }

  log(message: string, context?: Record<string, any>) {
    this.logger.log({ message, context });
  }

  warn(message: string, context?: Record<string, any>) {
    this.logger.warn({ message, context });
  }

  error(
    message: string,
    error?: Error | string,
    // context?: Record<string, any>,
  ) {
    this.logger.error({ error });
  }
}
