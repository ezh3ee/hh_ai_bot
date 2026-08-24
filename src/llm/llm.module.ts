import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LoggerModule } from '../logger/logger.module';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';

@Module({
  providers: [LLMFactory, LLMService, SettingsConfigService],
  imports: [LoggerModule],
  exports: [LLMService],
})
export class LlmModule {}
