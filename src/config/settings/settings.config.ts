import { registerAs } from '@nestjs/config';
import { settingsLoader } from './settings.loader';
import { SettingsConfig } from './settings.schema';

export default registerAs('settings', (): SettingsConfig => {
  return settingsLoader();
});
