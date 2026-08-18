import { z } from 'zod';

export const CallbackDataSchema = z.object({
  type: z.enum(['send', 'reject', 'edit']),
  vacancyId: z.coerce.number().int().positive(),
});

export type CallbackData = z.infer<typeof CallbackDataSchema>;

export function parseCallbackData(data: string): CallbackData | null {
  const parts = data.split('_');
  if (parts.length !== 2) return null;

  const result = CallbackDataSchema.safeParse({
    type: parts[0],
    vacancyId: parts[1],
  });

  return result.success ? result.data : null;
}
