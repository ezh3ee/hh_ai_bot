import { Injectable } from '@nestjs/common';
import {
  BaseLLMProvider,
  AskOptions,
} from '../interfaces/llm-provider.interface';
import type { LlmConfigInternal } from '../../config/llm.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class OllamaProvider extends BaseLLMProvider {
  private readonly url: string;
  private readonly model: string;

  constructor(
    config: LlmConfigInternal,
    settings: SettingsConfigService,
    logger: LoggerService,
  ) {
    super(config, settings, logger);
    this.url = config.OLLAMA_BASE_URL!;
    this.model = config.OLLAMA_MODEL!;
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.LLM_TIMEOUT_MS ?? 60000,
    );

    try {
      const res = await fetch(`${this.url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: {
            temperature:
              options?.temperature ??
              this.config.LLM_TEMPERATURE_ANALYSIS ??
              0.1,
            num_predict:
              options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS ?? 20,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content ?? '';
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
