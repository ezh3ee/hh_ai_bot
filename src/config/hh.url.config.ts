import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const hhUrlConfigSchema = z.object({
  HH_MAIN_URL: z.string(),
});

export type HhUrlConfig = z.infer<typeof hhUrlConfigSchema>;

export default registerAs('app', (): HhUrlConfig => {
  let data: HhUrlConfig;

  try {
    data = hhUrlConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`[HHURL Config]: Validation failed - ${error.message}`);
    }

    throw error;
  }

  return data;
});
