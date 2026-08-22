import { Module } from '@nestjs/common';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LLMFactory } from './llm.factory';
import { LLMService } from './llm.service';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import { LoggerModule } from '../logger/logger.module';

@Module({
  providers: [
    LLMFactory,
    LLMService,
    OllamaProvider,
    OpenAICompatibleProvider,
    SettingsConfigService,
  ],
  imports: [LoggerModule],
  exports: [LLMService],
})
export class LlmModule {}
