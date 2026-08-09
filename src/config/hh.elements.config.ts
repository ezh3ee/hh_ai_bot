import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const hhElementsConfigSchema = z.object({
  HH_PROFILE_ICON_DESKTOP: z.string(),
  HH_PROFILE_ICON_MOBILE: z.string(),
});

export type hhElementsConfig = z.infer<typeof hhElementsConfigSchema>;

export default registerAs('hhelements', (): hhElementsConfig => {
  let data: hhElementsConfig;

  try {
    data = hhElementsConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `[HHELEMENTS Config]: Validation failed - ${error.message}`,
      );
    }

    throw error;
  }

  return data;
});
