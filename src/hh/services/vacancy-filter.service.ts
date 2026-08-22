import { Injectable } from '@nestjs/common';
import { SettingsConfigService } from '../../config/settings/settings-config.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class VacancyFilterService {
  constructor(
    private readonly settings: SettingsConfigService,
    private readonly logger: LoggerService,
  ) {}

  // TODO: тут нужно наверное переделать на регулярки. ибо будет срабатывать на слова, которые не нужно срабатывать
  checkStopWords(text: string): boolean {
    const stopWords = this.settings.hh.stop_words ?? [];
    if (stopWords.length === 0) {
      return false;
    }

    const lowerText = text.toLowerCase();
    for (const word of stopWords) {
      if (lowerText.includes(word.toLowerCase())) {
        this.logger.log(`[Filter] Stop word found: "${word}"`);
        return true;
      }
    }
    return false;
  }
}
