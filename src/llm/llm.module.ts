import { Module } from '@nestjs/common';
import { LoggerModule } from '../logger/logger.module';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';

@Module({
  providers: [LLMFactory, LLMService],
  imports: [LoggerModule],
  exports: [LLMService],
})
export class LlmModule {}
