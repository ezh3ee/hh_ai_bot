import type { ConfigType } from '@nestjs/config';
import llmConfig from '../../config/llm.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';
import {
  AskOptions,
  BaseLLMProvider,
} from '../interfaces/llm-provider.interface';
import { isOllamaChatResponse } from '../ollama-response.schema';

export class OllamaProvider extends BaseLLMProvider {
  private readonly url: string;
  private readonly model: string;

  constructor(
    config: ConfigType<typeof llmConfig>,
    settings: SettingsConfigService,
    logger: LoggerService,
  ) {
    super(config, settings, logger);
    if (config.LLM_PROVIDER !== 'ollama') {
      throw new Error('OllamaProvider requires LLM_PROVIDER=ollama');
    }
    const ollamaConfig = config;
    this.url = ollamaConfig.OLLAMA_BASE_URL;
    this.model = ollamaConfig.OLLAMA_MODEL;
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.LLM_TIMEOUT_MS,
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
              options?.temperature ?? this.config.LLM_TEMPERATURE_ANALYSIS,
            num_predict:
              options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama HTTP ${res.status}: ${errorText}`);
      }

      const data: unknown = await res.json();

      if (!isOllamaChatResponse(data)) {
        this.logger.error(
          'Invalid Ollama response structure',
          new Error('Zod validation failed'),
          { response: data },
        );
        throw new Error('Invalid Ollama API response structure');
      }

      return data.message.content ?? '';
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
