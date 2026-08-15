import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import llmConfig from '../config/llm.config';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import { SettingsConfigService } from '../config/settings/settings-config.service';
import { LoggerService } from '../logger/logger.service';
import { BaseLLMProvider } from './interfaces/llm-provider.interface';
import { LlmConfigInternal } from '../config/llm.config';

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
    const cfg = this.config as LlmConfigInternal;
    const provider = cfg.LLM_PROVIDER;
    switch (provider) {
      case 'ollama':
        this.logger.log(`LLM Provider: ollama (${cfg.OLLAMA_MODEL})`);
        return this.ollamaProvider;
      case 'openrouter':
      case 'polza':
      case 'openai-compatible':
        this.logger.log(
          `LLM Provider: ${provider} (${this.getModelName(cfg)})`,
        );
        return this.openaiProvider.configure(cfg);
      default: {
        const unknownProvider: string = provider;
        throw new Error(`Unknown LLM provider: ${unknownProvider}`);
      }
    }
  }

  private getModelName(cfg: LlmConfigInternal): string {
    const provider = cfg.LLM_PROVIDER;
    switch (provider) {
      case 'openrouter':
        return cfg.OPENROUTER_MODEL!;
      case 'polza':
        return cfg.POLZA_MODEL!;
      case 'openai-compatible':
        return cfg.OPENAI_COMPATIBLE_MODEL!;
      default:
        return 'unknown';
    }
  }
}
