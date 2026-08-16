import { z } from 'zod';

export const OllamaChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  message: z.object({
    role: z.string(),
    content: z.string(),
  }),
  done: z.boolean(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export type OllamaChatResponse = z.infer<typeof OllamaChatResponseSchema>;

export function isOllamaChatResponse(
  data: unknown,
): data is OllamaChatResponse {
  return OllamaChatResponseSchema.safeParse(data).success;
}
