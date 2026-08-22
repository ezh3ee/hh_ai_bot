import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AskOptions,
  BaseLLMProvider,
} from './interfaces/llm-provider.interface';
import { LLMFactory } from './llm.factory';
import { Candidate, Vacancy } from './llm.types';

@Injectable()
export class LLMService implements OnModuleInit {
  private provider!: BaseLLMProvider;

  constructor(private readonly factory: LLMFactory) {}

  onModuleInit() {
    this.provider = this.factory.create();
  }

  async ask(prompt: string, options?: AskOptions): Promise<string> {
    return this.provider.ask(prompt, options);
  }

  async analyzeVacancy(
    text: string,
    candidate: Candidate,
  ): Promise<'YES' | 'NO'> {
    return this.provider.analyzeVacancy(text, candidate);
  }

  async generateCoverLetter(
    vacancy: Vacancy,
    candidate: Candidate,
    additionalInstructions?: string,
  ): Promise<string> {
    return this.provider.generateCoverLetter(
      vacancy,
      candidate,
      additionalInstructions,
    );
  }
}
