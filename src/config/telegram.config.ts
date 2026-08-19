import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const telegramConfigSchema = z.object({
  BOT_TOKEN: z.string(),
  CHAT_ID: z.string(),
  TELEGRAM_WAIT_TIMEOUT_MS: z.coerce.number().int().positive().default(3600000),
});

export type TgConfig = z.infer<typeof telegramConfigSchema>;

export default registerAs('telegram', (): TgConfig => {
  let data: TgConfig;

  try {
    data = telegramConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `[TELEGRAM Config]: Validation failed - ${error.message}`,
      );
    }

    throw error;
  }

  return data;
});
