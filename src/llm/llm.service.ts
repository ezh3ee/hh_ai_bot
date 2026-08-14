import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { OpenAI } from 'openai';
import type { ConfigType } from '@nestjs/config';
import llmConfig from '../config/llm.config';
import { LoggerService } from '../logger/logger.service';

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  salary?: string;
  location?: string;
}

export interface Candidate {
  name: string;
  desired_positions: string[];
  salary_expectation: string;
  work_format: string[];
  experience_summary: string;
  projects?: Record<
    string,
    {
      name: string;
      role: string;
      period: string;
      type: string;
      url: string;
      stack: string[];
      description: string;
    }
  >;
}

@Injectable()
export class LLMService implements OnModuleInit {
  private provider: 'ollama' | 'openrouter' | 'polza' | 'openai-compatible';
  private ollamaUrl: string;
  private ollamaModel: string;
  private openaiClient: OpenAI;
  private openaiModel: string;

  constructor(
    @Inject(llmConfig.KEY)
    private readonly config: ConfigType<typeof llmConfig>,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    this.provider = this.config.LLM_PROVIDER;

    if (this.provider === 'ollama') {
      this.ollamaUrl = this.config.OLLAMA_BASE_URL;
      this.ollamaModel = this.config.OLLAMA_MODEL;
    } else {
      const cfg = this.getOpenAICompatibleConfig();
      this.openaiClient = new OpenAI({
        baseURL: cfg.baseURL,
        apiKey: cfg.apiKey,
        timeout: this.config.LLM_TIMEOUT_MS,
      });
      this.openaiModel = cfg.model;
    }
    this.logger.log(`LLM: ${this.provider} (${this.getModel()})`);
  }

  async ask(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    if (this.provider === 'ollama') {
      return this.askOllama(prompt, options);
    }
    return this.askOpenAICompatible(prompt, options);
  }

  async analyzeVacancy(text: string): Promise<'YES' | 'NO'> {
    const prompt = this.buildAnalysisPrompt(text);

    for (let i = 1; i <= this.config.LLM_MAX_RETRIES; i++) {
      const answer = await this.ask(prompt, {
        temperature: this.config.LLM_TEMPERATURE_ANALYSIS,
        maxTokens: this.config.LLM_MAX_TOKENS_ANALYSIS,
      });

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
        `LLM вернул невалидный ответ: "${answer}". Ожидается YES или NO. Попытка ${i}/${this.config.LLM_MAX_RETRIES}`,
      );
    }

    throw new Error(
      `LLM не вернул валидный ответ (YES/NO) после ${this.config.LLM_MAX_RETRIES} попыток`,
    );
  }

  async generateCoverLetter(
    vacancy: Vacancy,
    candidate: Candidate,
  ): Promise<string> {
    const prompt = this.buildCoverLetterPrompt(vacancy, candidate);
    return this.ask(prompt, {
      temperature: this.config.LLM_TEMPERATURE_COVER_LETTER,
      maxTokens: this.config.LLM_MAX_TOKENS_COVER_LETTER,
    });
  }

  private async askOllama(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.LLM_TIMEOUT_MS,
    );

    try {
      const res = await fetch(`${this.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.ollamaModel,
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          options: {
            temperature:
              options?.temperature ?? this.config.LLM_TEMPERATURE_ANALYSIS,
            num_predict:
              options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      return data.message?.content ?? '';
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async askOpenAICompatible(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const completion = await this.openaiClient.chat.completions.create({
      model: this.openaiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? this.config.LLM_TEMPERATURE_ANALYSIS,
      max_tokens: options?.maxTokens ?? this.config.LLM_MAX_TOKENS_ANALYSIS,
    });
    return completion.choices[0]?.message?.content ?? '';
  }

  private getModel(): string {
    return this.provider === 'ollama' ? this.ollamaModel : this.openaiModel;
  }

  private getOpenAICompatibleConfig(): {
    baseURL: string;
    apiKey: string;
    model: string;
  } {
    switch (this.config.LLM_PROVIDER) {
      case 'openrouter':
        return {
          baseURL: this.config.OPENROUTER_BASE_URL,
          apiKey: this.config.OPENROUTER_API_KEY!,
          model: this.config.OPENROUTER_MODEL,
        };
      case 'polza':
        return {
          baseURL: this.config.POLZA_BASE_URL,
          apiKey: this.config.POLZA_API_KEY!,
          model: this.config.POLZA_MODEL,
        };
      case 'openai-compatible':
        return {
          baseURL: this.config.OPENAI_COMPATIBLE_BASE_URL!,
          apiKey: this.config.OPENAI_COMPATIBLE_API_KEY!,
          model: this.config.OPENAI_COMPATIBLE_MODEL!,
        };
      default:
        throw new Error(
          `Unknown provider for OpenAI-compatible config: ${this.config.LLM_PROVIDER}`,
        );
    }
  }

  private buildAnalysisPrompt(vacancyText: string): string {
    return `Ты — эксперт по подбору вакансий. Проанализируй вакансию и реши, подходит ли она кандидату.

КРИТЕРИИ КАНДИДАТА:
- Backend разработчик на Node.js/TypeScript
- Опыт 2+ года
- Не подходят: Senior/Lead/Architect, чистый Frontend, не Node.js стек, менеджмент

ВАКАНСИЯ:
${vacancyText}

Ответь ТОЛКО одним словом: YES или NO`;
  }

  private buildCoverLetterPrompt(
    vacancy: Vacancy,
    candidate: Candidate,
  ): string {
    const projects = candidate.projects
      ? Object.values(candidate.projects)
          .map(
            (p) => `- ${p.name} (${p.role}, ${p.stack.join(', ')}) — ${p.url}`,
          )
          .join('\n')
      : 'Нет проектов';

    return `Напиши сопроводительное письмо для отклика на вакансию.

ВАКАНСИЯ:
Название: ${vacancy.title}
Компания: ${vacancy.company}
Описание: ${vacancy.description}
Зарплата: ${vacancy.salary || 'не указана'}
Локация: ${vacancy.location || 'не указана'}

КАНДИДАТ:
Имя: ${candidate.name}
Желаемые позиции: ${candidate.desired_positions.join(', ')}
Зарплатные ожидания: ${candidate.salary_expectation}
Формат работы: ${candidate.work_format.join(', ')}
Резюме: ${candidate.experience_summary}

ПРОЕКТ��:
${projects}

ПРАВИЛА:
- Пиши на русском языке
- 3-4 абзаца
- Живой, спокойный, уверенный стиль
- Упоминай релевантный стек под вакансию
- Если проект пересекается с темой вакансии — укажи его и ссылку
- Подпись в конце: ${candidate.name}
- Без markdown, без вводных фраз, только текст письма`;
  }
}
