import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LoggerService } from '../logger/logger.service';
import { LLMService } from './llm.service';

@Module({
  providers: [LLMService, LoggerService, SettingsConfigService],
  exports: [LLMService],
})
export class LlmModule {}
