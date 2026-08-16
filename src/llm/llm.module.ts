import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LoggerService } from '../logger/logger.service';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  providers: [
    LLMFactory,
    LLMService,
    OllamaProvider,
    OpenAICompatibleProvider,
    SettingsConfigService,
    LoggerService,
  ],
  exports: [LLMService],
})
export class LlmModule {}
