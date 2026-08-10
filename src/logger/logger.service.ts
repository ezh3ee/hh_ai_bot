import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class LoggerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoggerService.name);

  onApplicationBootstrap() {
    this.logger.log('The application graph is fully initialized.');
  }

  log(message: string) {
    this.logger.log(message);
  }

  warn(message: string, context?: Record<string, any>) {
    this.logger.warn({ message, context });
  }

  error(
    message: string,
    error?: Error | string,
    context?: Record<string, any>,
  ) {
    if (error instanceof Error) {
      this.logger.error(message, error.stack, context);
    } else {
      this.logger.error({ message, error, context });
    }
  }
}
