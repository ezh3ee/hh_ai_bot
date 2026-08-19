import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const mainConfigSchema = z.object({
  HH_HEADLESS: z.coerce.boolean().default(false),
  DATABASE_URL: z.string(),
  TELEGRAM_WAIT_TIMEOUT_MS: z.coerce.number().int().positive().default(3600000),
});

export type MainConfig = z.infer<typeof mainConfigSchema>;

export default registerAs('app', (): MainConfig => {
  let data: MainConfig;

  try {
    data = mainConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`[MAIN Config]: Validation failed - ${error.message}`);
    }

    throw error;
  }

  return data;
});
