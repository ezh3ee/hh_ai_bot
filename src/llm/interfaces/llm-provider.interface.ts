import type { ConfigType } from '@nestjs/config';
import llmConfig from '../../config/llm.config';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';
import { Candidate, Vacancy } from '../llm.types';

export interface AskOptions {
  temperature?: number;
  maxTokens?: number;
}

export type LlmProviderConfig = ConfigType<typeof llmConfig>;

export abstract class BaseLLMProvider {
  constructor(
    protected readonly config: LlmProviderConfig,
    protected readonly settings: SettingsConfigService,
    protected readonly logger: LoggerService,
  ) {}

  abstract ask(prompt: string, options?: AskOptions): Promise<string>;

  async analyzeVacancy(
    text: string,
    candidate: Candidate,
  ): Promise<'YES' | 'NO'> {
    const prompt = this.buildAnalysisPrompt(text, candidate);

    for (let i = 1; i <= (this.config.LLM_MAX_RETRIES ?? 3); i++) {
      const askOptions: AskOptions = {};
      if (this.config.LLM_TEMPERATURE_ANALYSIS !== undefined) {
        askOptions.temperature = this.config.LLM_TEMPERATURE_ANALYSIS;
      }
      if (this.config.LLM_MAX_TOKENS_ANALYSIS !== undefined) {
        askOptions.maxTokens = this.config.LLM_MAX_TOKENS_ANALYSIS;
      }

      const answer = await this.ask(prompt, askOptions);

      const cleaned = answer.trim().toUpperCase();
      if (cleaned === 'YES' || cleaned === 'NO') {
        if (i > 1) {
          this.logger.log(
            `Vacancy analysis validated on attempt ${i}: ${cleaned}`,
          );
        }
        return cleaned;
      }

      this.logger.warn(
        `LLM вернул невалидный ответ: "${answer}". Ожидается YES или NO. Попытка ${i}/${this.config.LLM_MAX_RETRIES ?? 3}`,
      );
    }

    throw new Error(
      `LLM не вернул валидный ответ (YES/NO) после ${this.config.LLM_MAX_RETRIES ?? 3} попыток`,
    );
  }

  async generateCoverLetter(
    vacancy: Vacancy,
    candidate: Candidate,
  ): Promise<string> {
    const prompt = this.buildCoverLetterPrompt(vacancy, candidate);
    const askOptions: AskOptions = {};
    if (this.config.LLM_TEMPERATURE_COVER_LETTER !== undefined) {
      askOptions.temperature = this.config.LLM_TEMPERATURE_COVER_LETTER;
    }
    if (this.config.LLM_MAX_TOKENS_COVER_LETTER !== undefined) {
      askOptions.maxTokens = this.config.LLM_MAX_TOKENS_COVER_LETTER;
    }
    return this.ask(prompt, askOptions);
  }

  protected buildAnalysisPrompt(text: string, candidate: Candidate): string {
    const basePrompt = this.settings.aiInstructions.is_suitable;
    const projects = candidate.projects
      ? Object.values(candidate.projects)
          .map(
            (p) => `- ${p.name} (${p.role}, ${p.stack.join(', ')}) — ${p.url}`,
          )
          .join('\n')
      : 'Нет проектов';
    return `${basePrompt}\n\nВАКАНСИЯ:\n${text}\nРезюме: ${candidate.experience_summary}\n\nМОИ ПРОЕКТЫ:\n${projects}`;
  }

  protected buildCoverLetterPrompt(
    vacancy: Vacancy,
    candidate: Candidate,
  ): string {
    const basePrompt = this.settings.aiInstructions.cover_letter;
    const projects = candidate.projects
      ? Object.values(candidate.projects)
          .map(
            (p) => `- ${p.name} (${p.role}, ${p.stack.join(', ')}) — ${p.url}`,
          )
          .join('\n')
      : 'Нет проектов';

    return `${basePrompt}\n\nВАКАНСИЯ:\nНазвание: ${vacancy.title}\nОписание: ${vacancy.description}\nРезюме: ${candidate.experience_summary}\n\nМОИ ПРОЕКТЫ:\n${projects}`;
  }
}
