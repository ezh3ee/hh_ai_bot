import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { OpenAI } from 'openai';
import llmConfig, { OpenAiLike } from '../../config/llm.config';
import { LoggerService } from '../../logger/logger.service';
import {
  AskOptions,
  BaseLLMProvider,
} from '../interfaces/llm-provider.interface';

export class OpenAICompatibleProvider extends BaseLLMProvider {
  private client: OpenAI | null = null;
  private model: string | null = null;

  constructor(
    @Inject(llmConfig.KEY)
    config: ConfigType<typeof llmConfig>,
    logger: LoggerService,
  ) {
    super(config, undefined as any, logger);
  }

  configure(cfg: OpenAiLike): this {
    this.model = cfg.model;
    this.client = new OpenAI({
      baseURL: cfg.baseURL,
      apiKey: cfg.apiKey,
      timeout: this.config.LLM_TIMEOUT_MS,
    });
    return this;
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    if (!this.client || !this.model) {
      throw new Error(
        'OpenAICompatibleProvider not configured. Call configure() first.',
      );
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? this.config.LLM_TEMPERATURE_ANALYSIS,
      max_tokens: options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS,
    });

    return completion.choices[0]?.message?.content ?? '';
  }
}
