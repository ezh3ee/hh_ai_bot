import { Global, Module } from '@nestjs/common';
import { SettingsConfigService } from './settings-config.service';

@Global()
@Module({
  providers: [SettingsConfigService],
  exports: [SettingsConfigService],
})
export class SettingsConfigModule {}
