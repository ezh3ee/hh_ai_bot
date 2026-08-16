import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import llmConfig, { toOpenAiLike } from '../config/llm.config';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LoggerService } from '../logger/logger.service';
import { BaseLLMProvider } from './interfaces/llm-provider.interface';

@Injectable()
export class LLMFactory {
  constructor(
    @Inject(llmConfig.KEY)
    private readonly config: ConfigType<typeof llmConfig>,
    private readonly ollamaProvider: OllamaProvider,
    private readonly openaiProvider: OpenAICompatibleProvider,
    private readonly settings: SettingsConfigService,
    private readonly logger: LoggerService,
  ) {}

  create(): BaseLLMProvider {
    const cfg = this.config;
    const provider = cfg.LLM_PROVIDER;
    switch (provider) {
      case 'ollama':
        this.logger.log(`LLM Provider: ollama (${cfg.OLLAMA_MODEL})`);
        return this.ollamaProvider;
      case 'openrouter':
      case 'polza':
      case 'openai-compatible': {
        const openAiCfg = toOpenAiLike(cfg);
        this.logger.log(`LLM Provider: ${provider} (${openAiCfg.model})`);
        return this.openaiProvider.configure(openAiCfg);
      }
      default: {
        const unknownProvider: string = provider;
        throw new Error(`Unknown LLM provider: ${unknownProvider}`);
      }
    }
  }
}
