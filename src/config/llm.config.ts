import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const LlmProviderEnum = z.enum([
  'ollama',
  'openrouter',
  'polza',
  'openai-compatible',
]);

const llmConfigSchema = z
  .object({
    LLM_PROVIDER: LlmProviderEnum.default('ollama'),

    OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3.1:8b'),

    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_BASE_URL: z
      .string()
      .url()
      .default('https://openrouter.ai/api/v1'),
    OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),

    POLZA_API_KEY: z.string().optional(),
    POLZA_BASE_URL: z.string().url().default('https://api.polza.ai/v1'),
    POLZA_MODEL: z.string().default('gpt-4o-mini'),

    OPENAI_COMPATIBLE_API_KEY: z.string().optional(),
    OPENAI_COMPATIBLE_BASE_URL: z.string().url().optional(),
    OPENAI_COMPATIBLE_MODEL: z.string().optional(),

    LLM_TEMPERATURE_ANALYSIS: z.coerce.number().min(0).max(2).default(0.1),
    LLM_TEMPERATURE_COVER_LETTER: z.coerce.number().min(0).max(2).default(0.4),
    LLM_MAX_TOKENS_ANALYSIS: z.coerce.number().positive().default(20),
    LLM_MAX_TOKENS_COVER_LETTER: z.coerce.number().positive().default(2000),
    LLM_TIMEOUT_MS: z.coerce.number().positive().default(60000),
    LLM_MAX_RETRIES: z.coerce.number().int().positive().default(3),
  })
  .refine(
    (data) => {
      if (data.LLM_PROVIDER === 'openrouter' && !data.OPENROUTER_API_KEY)
        return false;
      if (data.LLM_PROVIDER === 'polza' && !data.POLZA_API_KEY) return false;
      if (
        data.LLM_PROVIDER === 'openai-compatible' &&
        (!data.OPENAI_COMPATIBLE_API_KEY ||
          !data.OPENAI_COMPATIBLE_BASE_URL ||
          !data.OPENAI_COMPATIBLE_MODEL)
      )
        return false;
      return true;
    },
    {
      message:
        'Missing required API key/baseURL/model for selected LLM_PROVIDER',
      path: ['LLM_PROVIDER'],
    },
  );

export type LlmConfig = z.infer<typeof llmConfigSchema>;

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
