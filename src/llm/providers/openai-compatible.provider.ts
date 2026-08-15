import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import {
  BaseLLMProvider,
  AskOptions,
} from '../interfaces/llm-provider.interface';
import type { LlmConfigInternal } from '../../config/llm.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class OpenAICompatibleProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;

  constructor(
    config: LlmConfigInternal,
    settings: SettingsConfigService,
    logger: LoggerService,
  ) {
    super(config, settings, logger);
  }

  configure(config: LlmConfigInternal): this {
    const baseURL =
      config.OPENROUTER_BASE_URL ??
      config.POLZA_BASE_URL ??
      config.OPENAI_COMPATIBLE_BASE_URL;
    const apiKey =
      config.OPENROUTER_API_KEY ??
      config.POLZA_API_KEY ??
      config.OPENAI_COMPATIBLE_API_KEY;

    this.client = new OpenAI({
      baseURL,
      apiKey,
      timeout: config.LLM_TIMEOUT_MS ?? 60000,
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
    const cfg = this.config;
    switch (cfg.LLM_PROVIDER) {
      case 'openrouter':
        return cfg.OPENROUTER_MODEL!;
      case 'polza':
        return cfg.POLZA_MODEL!;
      case 'openai-compatible':
        return cfg.OPENAI_COMPATIBLE_MODEL!;
      default:
        return cfg.OPENROUTER_MODEL!;
    }
  }
}
