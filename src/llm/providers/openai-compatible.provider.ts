import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OpenAI } from 'openai';
import llmConfig from '../../config/llm.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';
import {
  AskOptions,
  BaseLLMProvider,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class OpenAICompatibleProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;

  constructor(
    @Inject(llmConfig.KEY)
    config: ConfigType<typeof llmConfig>,
    settings: SettingsConfigService,
    logger: LoggerService,
  ) {
    super(config, settings, logger);
  }

  configure(config: ConfigType<typeof llmConfig>): this {
    // Cast to access all possible properties regardless of discriminated union narrowing
    const cfg = config as Record<string, unknown>;
    const baseURL = (cfg.OPENROUTER_BASE_URL ??
      cfg.POLZA_BASE_URL ??
      cfg.OPENAI_COMPATIBLE_BASE_URL) as string;
    const apiKey = (cfg.OPENROUTER_API_KEY ??
      cfg.POLZA_API_KEY ??
      cfg.OPENAI_COMPATIBLE_API_KEY) as string;

    this.client = new OpenAI({
      baseURL,
      apiKey,
      timeout: this.config.LLM_TIMEOUT_MS ?? 60000,
    });
    return this;
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    if (!this.client) {
      throw new Error(
        'OpenAICompatibleProvider not configured. Call configure() first.',
      );
    }

    const completion = await this.client.chat.completions.create({
      model: this.getModel(),
      messages: [{ role: 'user', content: prompt }],
      temperature:
        options?.temperature ?? this.config.LLM_TEMPERATURE_ANALYSIS ?? 0.1,
      max_tokens:
        options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS ?? 20,
    });

    return completion.choices[0]?.message?.content ?? '';
  }

  private getModel(): string {
    const cfg = this.config as Record<string, unknown>;
    const provider = this.config.LLM_PROVIDER;
    switch (provider) {
      case 'openrouter':
        return cfg.OPENROUTER_MODEL as string;
      case 'polza':
        return cfg.POLZA_MODEL as string;
      case 'openai-compatible':
        return cfg.OPENAI_COMPATIBLE_MODEL as string;
      default:
        return cfg.OPENROUTER_MODEL as string;
    }
  }
}
