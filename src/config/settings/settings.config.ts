import { registerAs } from '@nestjs/config';
import { ZodError } from 'zod';
import { settingsLoader } from '../loader/yml-file.loader';
import { formatZodIssues } from '../validation/format-zod-error';
import { SettingsConfig, SettingsSchema } from './settings.schema';

export default registerAs('settings', (): SettingsConfig => {
  const ymlData = settingsLoader('settings');

  let data: SettingsConfig;

  try {
    data = SettingsSchema.parse(ymlData);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(
        `[SETTINGS Config]: Validation failed - ${formatZodIssues(error)}`,
      );
    }

    throw error;
  }

  return data;
});
