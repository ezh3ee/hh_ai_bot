import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class LoggerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(LoggerService.name);

  // Can be synchronous or asynchronous (async/await)
  onApplicationBootstrap() {
    this.logger.log('The application graph is fully initialized.');
  }
}
