import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const CommonFields = z.object({
  LLM_TEMPERATURE_ANALYSIS: z.coerce.number().min(0).max(2).optional(),
  LLM_TEMPERATURE_COVER_LETTER: z.coerce.number().min(0).max(2).optional(),
  LLM_MAX_TOKENS_ANALYSIS: z.coerce.number().positive().optional(),
  LLM_MAX_TOKENS_COVER_LETTER: z.coerce.number().positive().optional(),
  LLM_TIMEOUT_MS: z.coerce.number().positive().default(60000),
  LLM_MAX_RETRIES: z.coerce.number().int().positive().default(3),
});

const OllamaConfig = z
  .object({
    LLM_PROVIDER: z.literal('ollama'),
    OLLAMA_BASE_URL: z.url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3.1:8b'),
  })
  .merge(CommonFields);

const OpenRouterConfig = z
  .object({
    LLM_PROVIDER: z.literal('openrouter'),
    OPENROUTER_API_KEY: z.string(),
    OPENROUTER_BASE_URL: z.url().default('https://openrouter.ai/api/v1'),
    OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
  })
  .merge(CommonFields);

const PolzaConfig = z
  .object({
    LLM_PROVIDER: z.literal('polza'),
    POLZA_API_KEY: z.string(),
    POLZA_BASE_URL: z.url().default('https://api.polza.ai/v1'),
    POLZA_MODEL: z.string().default('gpt-4o-mini'),
  })
  .merge(CommonFields);

const OpenAICompatibleConfig = z
  .object({
    LLM_PROVIDER: z.literal('openai-compatible'),
    OPENAI_COMPATIBLE_API_KEY: z.string(),
    OPENAI_COMPATIBLE_BASE_URL: z.url(),
    OPENAI_COMPATIBLE_MODEL: z.string(),
  })
  .merge(CommonFields);

export const llmConfigSchema = z.discriminatedUnion('LLM_PROVIDER', [
  OllamaConfig,
  OpenRouterConfig,
  PolzaConfig,
  OpenAICompatibleConfig,
]);

export type LlmConfig = z.infer<typeof llmConfigSchema>;

export type OpenAiLike = {
  provider: 'openrouter' | 'polza' | 'openai-compatible';
  baseURL: string;
  apiKey: string;
  model: string;
};

export function toOpenAiLike(cfg: LlmConfig): OpenAiLike {
  switch (cfg.LLM_PROVIDER) {
    case 'openrouter':
      return {
        provider: cfg.LLM_PROVIDER,
        baseURL: cfg.OPENROUTER_BASE_URL,
        apiKey: cfg.OPENROUTER_API_KEY,
        model: cfg.OPENROUTER_MODEL,
      };
    case 'polza':
      return {
        provider: cfg.LLM_PROVIDER,
        baseURL: cfg.POLZA_BASE_URL,
        apiKey: cfg.POLZA_API_KEY,
        model: cfg.POLZA_MODEL,
      };
    case 'openai-compatible':
      return {
        provider: cfg.LLM_PROVIDER,
        baseURL: cfg.OPENAI_COMPATIBLE_BASE_URL,
        apiKey: cfg.OPENAI_COMPATIBLE_API_KEY,
        model: cfg.OPENAI_COMPATIBLE_MODEL,
      };
    case 'ollama':
      throw new Error('ollama идёт через OllamaProvider');
  }
}

export default registerAs('llm', (): LlmConfig => {
  let data: LlmConfig;
  try {
    data = llmConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`[LLM Config]: Validation failed - ${error.message}`);
    }
    throw error;
  }
  return data;
});
