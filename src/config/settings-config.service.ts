import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SettingsConfig,
  CandidateConfig,
  HhConfig,
  AiInstructionsConfig,
  ProjectConfig,
} from './settings.schema';

@Injectable()
export class SettingsConfigService {
  constructor(private readonly config: ConfigService) {}

  private get<T>(key: keyof SettingsConfig): T {
    const value = this.config.get<T>(`settings.${key}`);
    if (!value) {
      throw new Error(`Settings.${key} not loaded`);
    }
    return value;
  }

  get candidate(): CandidateConfig {
    return this.get('candidate');
  }

  get hh(): HhConfig {
    return this.get('hh');
  }

  get aiInstructions(): AiInstructionsConfig {
    return this.get('ai_instructions');
  }

  getProjects(): Record<string, ProjectConfig> {
    return (this.candidate.projects as Record<string, ProjectConfig>) ?? {};
  }

  getProject(key: string): ProjectConfig | undefined {
    return this.candidate.projects?.[key];
  }
}
