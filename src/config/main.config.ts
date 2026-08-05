import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const mainConfigSchema = z.object({
  TEST: z.string(),
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
