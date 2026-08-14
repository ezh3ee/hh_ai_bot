import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import settingsConfig from './settings.config';
import {
  AiInstructionsConfig,
  CandidateConfig,
  HhConfig,
  ProjectConfig,
} from './settings.schema';

@Injectable()
export class SettingsConfigService {
  constructor(
    @Inject(settingsConfig.KEY)
    private readonly settings: ConfigType<typeof settingsConfig>,
  ) {}

  get candidate(): CandidateConfig {
    return this.settings.candidate;
  }

  get hh(): HhConfig {
    return this.settings.hh;
  }

  get aiInstructions(): AiInstructionsConfig {
    return this.settings.ai_instructions;
  }

  getProjects(): Record<string, ProjectConfig> {
    return this.settings.candidate.projects ?? {};
  }

  getProject(key: string): ProjectConfig | undefined {
    return this.settings.candidate.projects?.[key];
  }
}
