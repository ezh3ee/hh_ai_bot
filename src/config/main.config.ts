import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';
import { formatZodIssues } from './validation/format-zod-error';

const mainConfigSchema = z.object({
  HH_HEADLESS: z.coerce.boolean().default(false),
  DATABASE_URL: z.string(),
  TEST_MODE: z.coerce.boolean(),
});

export type MainConfig = z.infer<typeof mainConfigSchema>;

export default registerAs('app', (): MainConfig => {
  let data: MainConfig;

  try {
    data = mainConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `[MAIN Config]: Validation failed - ${formatZodIssues(error)}`,
      );
    }

    throw error;
  }

  return data;
});
