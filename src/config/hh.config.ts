import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const hhConfigSchema = z.object({
  HH_MAIN_URL: z.string(),
  HH_PAGE_LOAD_DELAY_MS: z.coerce.number().int().positive().default(5000),
  HH_DROPDOWN_DELAY_MS: z.coerce.number().int().positive().default(2000),
  HH_SAFE_GET_TEXT_TIMEOUT_MS: z.coerce.number().int().positive().default(2000),
  HH_PAGINATION_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
});

export type HhConfig = z.infer<typeof hhConfigSchema>;

export default registerAs('hh', (): HhConfig => {
  let data: HhConfig;

  try {
    data = hhConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`[HH Config]: Validation failed - ${error.message}`);
    }

    throw error;
  }

  return data;
});
