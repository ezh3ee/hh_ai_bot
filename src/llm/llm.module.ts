import { Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { LLMFactory } from './llm.factory';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  providers: [LLMFactory, LLMService, OllamaProvider, OpenAICompatibleProvider],
  exports: [LLMService],
})
export class LlmModule {}
