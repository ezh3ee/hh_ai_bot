import { Injectable, OnModuleInit } from '@nestjs/common';
import { LLMFactory } from './llm.factory';
import {
  BaseLLMProvider,
  AskOptions,
} from './interfaces/llm-provider.interface';
import { Vacancy, Candidate } from './llm.types';

@Injectable()
export class LLMService implements OnModuleInit {
  private provider: BaseLLMProvider;

  constructor(private readonly factory: LLMFactory) {}

  onModuleInit() {
    this.provider = this.factory.create();
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    return this.provider.ask(prompt, options);
  }

  async analyzeVacancy(text: string): Promise<'YES' | 'NO'> {
    return this.provider.analyzeVacancy(text);
  }

  async generateCoverLetter(
    vacancy: Vacancy,
    candidate: Candidate,
  ): Promise<string> {
    return this.provider.generateCoverLetter(vacancy, candidate);
  }
}
